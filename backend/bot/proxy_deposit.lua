-- language: Lua, file: proxy_deposit.lua
-- *Bare metal execution test for PowerKuy Android*

LogToConsole("[+] SCRIPT EXECUTION STARTED")

AddHook("OnVariant", "test_hook_1", function(varlist)
    LogToConsole("DEBUG: OnVariant fired")
end)

AddHook("OnPacket", "test_hook_2", function(type, packet)
    LogToConsole("DEBUG: OnPacket fired")
end)

LogToConsole("[+] HOOKS REGISTERED")
