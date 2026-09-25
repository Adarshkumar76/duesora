import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  GET as getChannels,
  POST as postChannel,
} from "@/app/api/workspaces/[workspaceId]/integrations/route";
import {
  PATCH as patchChannel,
  DELETE as deleteChannel,
} from "@/app/api/workspaces/[workspaceId]/integrations/[channelId]/route";
import { POST as postTestChannel } from "@/app/api/workspaces/[workspaceId]/integrations/test/route";
import { auth } from "@/auth";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import {
  listNotificationChannels,
  createNotificationChannel,
  getNotificationChannelById,
  updateNotificationChannel,
  deleteNotificationChannel,
} from "@/lib/integrations/chat/repository";
import { sendTestChatAlert } from "@/lib/integrations/chat/dispatcher";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
}));

vi.mock("@/lib/integrations/chat/repository", () => ({
  listNotificationChannels: vi.fn(),
  createNotificationChannel: vi.fn(),
  getNotificationChannelById: vi.fn(),
  updateNotificationChannel: vi.fn(),
  deleteNotificationChannel: vi.fn(),
}));

vi.mock("@/lib/integrations/chat/dispatcher", () => ({
  sendTestChatAlert: vi.fn(),
}));

describe("API: Workspace Chat Integrations (Slack & Discord)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/workspaces/[workspaceId]/integrations", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);
      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/integrations");
      const res = await getChannels(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(401);
    });

    it("returns 403 when user lacks permissions", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
      vi.mocked(requireWorkspaceRole).mockRejectedValue(new Error("FORBIDDEN"));

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/integrations");
      const res = await getChannels(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(403);
    });

    it("returns 200 with list of channels", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
      vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);
      vi.mocked(listNotificationChannels).mockResolvedValue([
        {
          id: "ch-1",
          workspaceId: "ws-1",
          provider: "slack",
          name: "#alerts",
          webhookUrl: "https://hooks.slack.com/services/T00/B00/ABC",
          events: ["*"],
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/integrations");
      const res = await getChannels(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data).toHaveLength(1);
      expect(json.data[0].provider).toBe("slack");
    });
  });

  describe("POST /api/workspaces/[workspaceId]/integrations", () => {
    it("returns 400 when webhookUrl is invalid for provider", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
      vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/integrations", {
        method: "POST",
        body: JSON.stringify({
          provider: "slack",
          name: "#alerts",
          webhookUrl: "https://invalid.com/bad",
        }),
      });

      const res = await postChannel(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error.message).toContain("Invalid Slack Webhook URL");
    });

    it("returns 201 and creates new channel successfully", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
      vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);
      vi.mocked(createNotificationChannel).mockResolvedValue({
        id: "ch-new",
        workspaceId: "ws-1",
        provider: "discord",
        name: "#devops",
        webhookUrl: "https://discord.com/api/webhooks/123/xyz",
        events: ["reminder.upcoming"],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/integrations", {
        method: "POST",
        body: JSON.stringify({
          provider: "discord",
          name: "#devops",
          webhookUrl: "https://discord.com/api/webhooks/123/xyz",
          events: ["reminder.upcoming"],
        }),
      });

      const res = await postChannel(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.data.id).toBe("ch-new");
      expect(json.data.provider).toBe("discord");
    });

    it("creates Telegram and Microsoft Teams channels successfully", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
      vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

      vi.mocked(createNotificationChannel).mockResolvedValueOnce({
        id: "ch-tg",
        workspaceId: "ws-1",
        provider: "telegram",
        name: "@duesora_bot",
        webhookUrl: "https://api.telegram.org/bot12345:TOKEN/sendMessage?chat_id=999",
        events: ["reminder.upcoming"],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const tgReq = new NextRequest("http://localhost:3000/api/workspaces/ws-1/integrations", {
        method: "POST",
        body: JSON.stringify({
          provider: "telegram",
          name: "@duesora_bot",
          webhookUrl: "https://api.telegram.org/bot12345:TOKEN/sendMessage?chat_id=999",
          events: ["reminder.upcoming"],
        }),
      });

      const tgRes = await postChannel(tgReq, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(tgRes.status).toBe(201);
      const tgJson = await tgRes.json();
      expect(tgJson.data.provider).toBe("telegram");

      vi.mocked(createNotificationChannel).mockResolvedValueOnce({
        id: "ch-teams",
        workspaceId: "ws-1",
        provider: "teams",
        name: "IT Ops",
        webhookUrl: "https://outlook.office.com/webhook/abc/IncomingWebhook/def",
        events: ["*"],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const teamsReq = new NextRequest("http://localhost:3000/api/workspaces/ws-1/integrations", {
        method: "POST",
        body: JSON.stringify({
          provider: "teams",
          name: "IT Ops",
          webhookUrl: "https://outlook.office.com/webhook/abc/IncomingWebhook/def",
          events: ["*"],
        }),
      });

      const teamsRes = await postChannel(teamsReq, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(teamsRes.status).toBe(201);
      const teamsJson = await teamsRes.json();
      expect(teamsJson.data.provider).toBe("teams");

      vi.mocked(createNotificationChannel).mockResolvedValueOnce({
        id: "ch-ntfy",
        workspaceId: "ws-1",
        provider: "ntfy",
        name: "ntfy-alerts",
        webhookUrl: "https://ntfy.sh/my_secret_alerts",
        events: ["*"],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const ntfyReq = new NextRequest("http://localhost:3000/api/workspaces/ws-1/integrations", {
        method: "POST",
        body: JSON.stringify({
          provider: "ntfy",
          name: "ntfy-alerts",
          webhookUrl: "https://ntfy.sh/my_secret_alerts",
          events: ["*"],
        }),
      });

      const ntfyRes = await postChannel(ntfyReq, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(ntfyRes.status).toBe(201);
      const ntfyJson = await ntfyRes.json();
      expect(ntfyJson.data.provider).toBe("ntfy");

      vi.mocked(createNotificationChannel).mockResolvedValueOnce({
        id: "ch-gotify",
        workspaceId: "ws-1",
        provider: "gotify",
        name: "gotify-alerts",
        webhookUrl: "https://gotify.example.com/message?token=mytoken123",
        events: ["*"],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const gotifyReq = new NextRequest("http://localhost:3000/api/workspaces/ws-1/integrations", {
        method: "POST",
        body: JSON.stringify({
          provider: "gotify",
          name: "gotify-alerts",
          webhookUrl: "https://gotify.example.com/message?token=mytoken123",
          events: ["*"],
        }),
      });

      const gotifyRes = await postChannel(gotifyReq, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(gotifyRes.status).toBe(201);
      const gotifyJson = await gotifyRes.json();
      expect(gotifyJson.data.provider).toBe("gotify");
    });
  });

  describe("PATCH & DELETE /api/workspaces/[workspaceId]/integrations/[channelId]", () => {
    it("updates channel active state via PATCH", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
      vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);
      vi.mocked(getNotificationChannelById).mockResolvedValue({
        id: "ch-1",
        workspaceId: "ws-1",
        provider: "slack",
        name: "#alerts",
        webhookUrl: "https://hooks.slack.com/services/T00/B00/ABC",
        events: ["*"],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(updateNotificationChannel).mockResolvedValue({
        id: "ch-1",
        workspaceId: "ws-1",
        provider: "slack",
        name: "#alerts",
        webhookUrl: "https://hooks.slack.com/services/T00/B00/ABC",
        events: ["*"],
        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/integrations/ch-1", {
        method: "PATCH",
        body: JSON.stringify({ active: false }),
      });

      const res = await patchChannel(req, {
        params: Promise.resolve({ workspaceId: "ws-1", channelId: "ch-1" }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.active).toBe(false);
    });

    it("deletes channel via DELETE", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
      vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);
      vi.mocked(getNotificationChannelById).mockResolvedValue({
        id: "ch-1",
        workspaceId: "ws-1",
        provider: "slack",
        name: "#alerts",
        webhookUrl: "https://hooks.slack.com/services/T00/B00/ABC",
        events: ["*"],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(deleteNotificationChannel).mockResolvedValue(true);

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/integrations/ch-1", {
        method: "DELETE",
      });

      const res = await deleteChannel(req, {
        params: Promise.resolve({ workspaceId: "ws-1", channelId: "ch-1" }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.success).toBe(true);
    });
  });

  describe("POST /api/workspaces/[workspaceId]/integrations/test", () => {
    it("dispatches live test notification successfully", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-1", name: "Admin User", email: "admin@test.com" },
      } as never);
      vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);
      vi.mocked(sendTestChatAlert).mockResolvedValue({ success: true });

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/integrations/test", {
        method: "POST",
        body: JSON.stringify({
          provider: "slack",
          webhookUrl: "https://hooks.slack.com/services/T00/B00/ABC",
          name: "#alerts",
        }),
      });

      const res = await postTestChannel(req, {
        params: Promise.resolve({ workspaceId: "ws-1" }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.success).toBe(true);
      expect(json.data.message).toContain("Test alert sent successfully");
    });
  });
});
