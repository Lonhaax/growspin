-- language: Lua, file: proxy_deposit.lua
-- *Android Hook Brute-Forcer*

local hookNames = {
    "OnVariant", "onVariant", "OnVarlist", "onVarlist",
    "OnPacket", "onPacket", "OnGamePacket", "onGamePacket",
    "OnTextPacket", "onTextPacket", "OnSendToServer", "onSendToServer",
    "OnDialogRequest", "onDialogRequest", "OnProcess", "onProcess",
    "OnTalkBubble", "onTalkBubble", "OnConsoleMessage", "onConsoleMessage",
    "OnEvent", "onEvent", "OnMessage", "onMessage"
}

LogToConsole("=========================================")
LogToConsole("STARTING ANDROID HOOK BRUTE-FORCE")
LogToConsole("=========================================")

for i, name in ipairs(hookNames) do
    local hookId = "brute_" .. tostring(i)
    -- Wrap in pcall just in case AddHook crashes on invalid names
    pcall(function()
        AddHook(name, hookId, function(...)
            LogToConsole("DEBUG: HOOK FIRED -> " .. tostring(name))
        end)
    end)
end

LogToConsole("[+] Android Hook Brute-Forcer loaded. Do a trade/drop and see what fires!")
