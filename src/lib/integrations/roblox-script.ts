/**
 * Generates the Roblox server script for a specific integration. Interpolated
 * with that integration's real endpoint + secret so it's ready to paste
 * straight into ServerScriptService — no placeholders left for the admin to
 * fill in by hand.
 */
export function buildRobloxScript(opts: { apiUrl: string; secret: string; universeId: string; placeId: string }): string {
  return `--[[
  Breakroom Roblox Chat Logger
  ------------------------------------------------------------
  Forwards in-game chat (via TextChatService) to your Breakroom
  workspace. Install this as a Script inside ServerScriptService.

  Configuration is already filled in below for this integration.
  If you ever regenerate the secret in Breakroom, paste the new
  one in here (BREAKROOM_SECRET) — the old one stops working the
  moment you regenerate it.
--]]

local TextChatService = game:GetService("TextChatService")
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")

-- ── Configuration ──────────────────────────────────────────
local BREAKROOM_API_URL = "${opts.apiUrl}"
local BREAKROOM_SECRET = "${opts.secret}"
local UNIVERSE_ID = "${opts.universeId}"
local PLACE_ID = "${opts.placeId}"
-- ────────────────────────────────────────────────────────────

local JOB_ID = game.JobId ~= "" and game.JobId or "studio-session"

-- Basic retry + de-dupe bookkeeping. Roblox's TextChatService can fire more
-- than once for the same message in rare edge cases, so we track a short
-- rolling window of recently-sent message signatures.
local recentlySent = {}
local RECENT_WINDOW_SECONDS = 5
local MAX_RETRIES = 3
local RETRY_DELAY_SECONDS = 1.5

local function pruneRecentlySent()
	local now = os.clock()
	for key, sentAt in pairs(recentlySent) do
		if now - sentAt > RECENT_WINDOW_SECONDS then
			recentlySent[key] = nil
		end
	end
end

local function sendChatMessage(payload)
	local body = HttpService:JSONEncode(payload)

	for attempt = 1, MAX_RETRIES do
		local ok, response = pcall(function()
			return HttpService:RequestAsync({
				Url = BREAKROOM_API_URL,
				Method = "POST",
				Headers = {
					["Content-Type"] = "application/json",
					["Authorization"] = "Bearer " .. BREAKROOM_SECRET,
				},
				Body = body,
			})
		end)

		if ok and response and response.Success then
			return true
		end

		-- Don't hammer Breakroom (or Roblox's HTTP rate limits) on failure.
		if attempt < MAX_RETRIES then
			task.wait(RETRY_DELAY_SECONDS * attempt)
		else
			warn("[Breakroom] Failed to forward chat message after " .. MAX_RETRIES .. " attempts: " .. tostring(response and response.StatusMessage or "unknown error"))
		end
	end

	return false
end

local function onIncomingMessage(textChatMessage)
	-- Only forward real player chat, not system/status messages.
	local speaker = textChatMessage.TextSource
	if not speaker then
		return
	end

	local player = Players:GetPlayerByUserId(speaker.UserId)
	if not player then
		return
	end

	-- TextChatService gives us the message AFTER Roblox's own chat filter has
	-- already run — we never see or forward unfiltered text.
	local text = textChatMessage.Text
	if not text or text == "" then
		return
	end

	pruneRecentlySent()
	local dedupeKey = player.UserId .. ":" .. text .. ":" .. tostring(math.floor(os.clock()))
	if recentlySent[dedupeKey] then
		return
	end
	recentlySent[dedupeKey] = os.clock()

	local payload = {
		universeId = UNIVERSE_ID,
		placeId = PLACE_ID,
		jobId = JOB_ID,
		userId = player.UserId,
		username = player.Name,
		displayName = player.DisplayName,
		message = text,
		timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ"),
	}

	-- Fire-and-forget on a separate thread so a slow/failed request never
	-- stalls the chat system or the rest of the game.
	task.spawn(function()
		local ok = pcall(sendChatMessage, payload)
		if not ok then
			warn("[Breakroom] Unexpected error forwarding chat message")
		end
	end)
end

TextChatService.MessageReceived:Connect(onIncomingMessage)

print("[Breakroom] Roblox Chat Logger connected — forwarding chat to Breakroom.")
`;
}
