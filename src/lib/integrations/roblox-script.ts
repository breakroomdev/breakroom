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
			print("[Breakroom] Message forwarded successfully (status " .. tostring(response.StatusCode) .. ").")
			return true
		end

		local reason
		if not ok then
			reason = "HttpService threw: " .. tostring(response)
		elseif response then
			reason = "HTTP " .. tostring(response.StatusCode) .. " " .. tostring(response.StatusMessage) .. " — " .. tostring(response.Body)
		else
			reason = "unknown error"
		end

		if attempt < MAX_RETRIES then
			warn("[Breakroom] Attempt " .. attempt .. "/" .. MAX_RETRIES .. " failed (" .. reason .. "), retrying…")
			-- Don't hammer Breakroom (or Roblox's HTTP rate limits) on failure.
			task.wait(RETRY_DELAY_SECONDS * attempt)
		else
			warn("[Breakroom] Giving up after " .. MAX_RETRIES .. " attempts: " .. reason)
		end
	end

	return false
end

local function onIncomingMessage(textChatMessage)
	print("[Breakroom] TextChatService.MessageReceived fired.")

	-- Only forward real player chat, not system/status messages.
	local speaker = textChatMessage.TextSource
	if not speaker then
		print("[Breakroom] Skipped — no TextSource (likely a system message).")
		return
	end

	local player = Players:GetPlayerByUserId(speaker.UserId)
	if not player then
		print("[Breakroom] Skipped — TextSource UserId " .. tostring(speaker.UserId) .. " has no matching Player.")
		return
	end

	-- TextChatService gives us the message AFTER Roblox's own chat filter has
	-- already run — we never see or forward unfiltered text.
	local text = textChatMessage.Text
	if not text or text == "" then
		print("[Breakroom] Skipped — empty message text (likely filtered to nothing).")
		return
	end

	pruneRecentlySent()
	local dedupeKey = player.UserId .. ":" .. text .. ":" .. tostring(math.floor(os.clock()))
	if recentlySent[dedupeKey] then
		print("[Breakroom] Skipped — duplicate of a message just sent.")
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

	print("[Breakroom] Sending message from " .. player.Name .. " to " .. BREAKROOM_API_URL .. "…")

	-- Fire-and-forget on a separate thread so a slow/failed request never
	-- stalls the chat system or the rest of the game.
	task.spawn(function()
		local ok, err = pcall(sendChatMessage, payload)
		if not ok then
			warn("[Breakroom] Unexpected Lua error while forwarding: " .. tostring(err))
		end
	end)
end

TextChatService.MessageReceived:Connect(onIncomingMessage)

print("[Breakroom] Roblox Chat Logger connected — forwarding chat to Breakroom.")
print("[Breakroom] Endpoint: " .. BREAKROOM_API_URL .. " | Universe " .. UNIVERSE_ID .. " | Place " .. PLACE_ID)
`;
}
