--=== MAIN SETTINGS ===--
Target_Path = "C:\\Users\\jake\\Desktop\\depo trade\\httpserver\\bots\\"..getBot().name..".json"

Process_Table = {
    [1] = { -- 1 st bot from bot list
Deposit_World = "longtbl",
        Vault_World   = "1lkll|gtblnew22"
    }
}

--=== WEBHOOK SETTINGS ===--
Webhook_Url = "XXX" -- write here your webhook url to send important messages
Discord_ID  = "XXX" -- write here your discord id to send webhook with tag @user

--=== DELAY SETTINGS ===--
Warp_Delay      = 8000 -- Warp delay by miliseconds
Move_Interval   = 240  -- Move interval (lucifer)
Move_Range      = 4    -- Move range (lucifer)
Wait_User       = 1000 -- Waiting user delay by miliseconds (includes read json delay & and growid check in world)
Save_Vault      = 1    -- After someone add balance bot will wait new user for x minutes before go to vault world

--=== RECONNECT DELAYS ===--
Reconnect_Delay = 8000 -- Reconnect delay after bot online
Hard_Warp_Delay = 1    -- Hard warp delay by minutes
Retry_Hard_Warp = 5    -- Bot will offline Hard_Warp_Delay minutes when x failed warp
MT_Delay        = 30   -- Maintenance delay by minutes
Ercon_Delay     = 1    -- Error connecting delay by minutes

--=== DONT EDIT BELOW ===--
local json = require("json")
local bot = getBot()
local world = bot:getWorld()
local inventory = bot:getInventory()
local botname = bot.name
local botlist = {}
local expirytime, targetMode = 0, ""
local nuked, wrongdoor, level, worldempty, expired, stopped = false, false, false, false, false, false
local depoworld, vaultworld, vaultworldid, vaultx, vaulty, checkx, checky = nil, nil, nil, 100, 100, 100, 100
local BGL, DL = 7188, 1796
local lockvalue = {
    [BGL] = 100,
    [DL] = 10000
}

local function sortedPairsNumeric(t)
    local keys = {}
    for k in pairs(t) do
        if type(k) == "number" then
            table.insert(keys, k)
        end
    end
    table.sort(keys)
    local i = 0
    return function()
        i = i + 1
        local key = keys[i]
        if key then
            return key, t[key]
        end
    end
end

local function setWorlds()
    botlist[botname] = {
        Deposit_World = Process_Table[1].Deposit_World,
        Vault_World = Process_Table[1].Vault_World
    }
end

local function customPrint(data)
    return print("[" .. botname .. "] " .. data)
end

local function SendWebhook(Text)
    wh = Webhook.new(Webhook_Url)
    wh.username = botname
    wh.content = Text .. "\n<@" .. Discord_ID .. ">"
    wh:send()
end

local function changeStatus(data)
    bot.custom_status = data
    sleep(100)
end

local function setBots()
    changeStatus("Script Started")
    customPrint("Script Started!")
    setWorlds()
    depoworld = botlist[botname].Deposit_World:upper()
    local vaultconfig = botlist[botname].Vault_World:upper()
    vaultworld, vaultworldid = vaultconfig:match("([^|]+)|([^|]+)")
    if not vaultworld or not vaultworldid then
        error("Wrong format for vault world (Ex: 'WORLD|ID')", 2)
    end
   -- lucifer ayarlama
    bot.auto_reconnect = true
    sleep(150)
    bot.auto_collect = false
    sleep(150)
end

local function waitUntilOnline()
    if bot.status ~= 1 or bot:getPing() == 0 then
        customPrint("Bot disconnected trying to reconnect!")
        while bot.status ~= 1 or bot:getPing() == 0 do
            if expirytime ~= 0 and os.time() > expirytime then expired = true return end
            if bot.status == BotStatus.error_connecting then
                changeStatus("Error Connecting")
                customPrint("Bot has error connecting status retrying in " .. Ercon_Delay .. " minutes!")
                bot.auto_reconnect = false
                sleep(60000 * Ercon_Delay)
                bot.auto_reconnect = true
            elseif bot.status == BotStatus.maintenance then
                changeStatus("Server Maintenance")
                customPrint("Server is in maintenance retrying in " .. MT_Delay .. " minutes!")
                bot.auto_reconnect = false
                sleep(60000 * MT_Delay)
                bot.auto_reconnect = true
            elseif bot.status == BotStatus.account_banned or bot.status == BotStatus.account_suspended then
                customPrint("Account got banned!")
                bot.auto_reconnect = false
                sleep(500)
                stopped = true
                return false
            end
            sleep(1000)
        end
        sleep(Reconnect_Delay)
    end
    return true
end

local function warpEvent(var, netid)
    if var:get(0):getString() == "OnConsoleMessage" then
        local msg = var:get(1):getString():lower()
        if msg:find("inaccessible") then
            nuked = true
            unlistenEvents()
        elseif msg:find("lower than level") then
            level = true
            unlistenEvents()
        end
    end
end

local function warpWorld(worldotw, idotw, checkdoor)
    nuked, level, wrongdoor = false, false, false
    if world.name ~= worldotw or bot.status ~= 1 then
        local retryCount = 0
        addEvent(Event.variantlist, warpEvent)
        while waitUntilOnline() and world.name ~= worldotw and not nuked and not level do
            if expirytime ~= 0 and os.time() > expirytime then expired = true return end
            bot:warp(idotw == "NONE" and worldotw or worldotw .. "|" .. idotw)
            listenEvents(3)
            if not nuked and not level then
                if world.name ~= worldotw then
                    if Warp_Delay > 3000 then sleep(Warp_Delay - 3000) end
                    retryCount = retryCount + 1
                    if retryCount >= Retry_Hard_Warp then
                        changeStatus("Hard Warp")
                        customPrint("Hard warp detected retrying in " .. Hard_Warp_Delay .. " minutes...")
                        bot.auto_reconnect = false
                        sleep(500)
                        bot:disconnect()
                        sleep(60000 * Hard_Warp_Delay)
                        bot.auto_reconnect = true
                        retryCount = 0
                    end
                else
                    sleep(2000)
                end
            else
                sleep(Warp_Delay)
            end
        end
        removeEvent(Event.variantlist)
        if nuked or level or stopped then return end
    end
    if checkdoor and idotw ~= "NONE" and getTile(bot.x, bot.y).fg == 6 then
        local idRetry = 0
        while waitUntilOnline() and not wrongdoor and ((getTile(bot.x, bot.y).fg == 6) or (world.name == "EXIT") or (getInfo(getTile(bot.x, bot.y).fg).action_type ~= 10 and getInfo(getTile(bot.x, bot.y).fg).action_type ~= 2)) do
            if expirytime ~= 0 and os.time() > expirytime then expired = true return end
            bot:warp(idotw == "NONE" and worldotw or worldotw .. "|" .. idotw)
            sleep(Warp_Delay)
            idRetry = idRetry + 1
            if idRetry > 3 then
                wrongdoor = true
            end
        end
    end
end

local function reconnect(dataworld, dataworldid, checkdoor)
    if not waitUntilOnline() then return false end
    if dataworld ~= "" then
        warpWorld(dataworld, dataworldid, checkdoor)
        if nuked or wrongdoor or level or stopped then return false end
    end
    return true
end

local function isPathFindable(x, y)
    if bot:isInTile(x, y) or #bot:getPath(x, y) > 0 then
        return true
    end
    return false
end

local function sendPhonePacket(num, extra, datax, datay)
    local pkt =
        "action|dialog_return\n"..
        "dialog_name|phonecall\n"..
        "tilex|"..datax.."|\n"..
        "tiley|"..datay.."|\n"..
        "num|"..num.."|\n"
    if extra then
        pkt = pkt .. extra .. "\n"
    end
    sendPacket(2, pkt)
end

local function convertBGL(dataworld, dataworldid)
    if not reconnect(dataworld, dataworldid, true) then return end
    if inventory:getItemCount(DL) < 100 then return end
    local tiles = world:getTiles()
    local phonex, phoney = nil, nil
    for i = 1, #tiles do
        local tile = tiles[i]
        if tile.fg == 3898 and isPathFindable(tile.x, tile.y) then
            phonex, phoney = tile.x, tile.y
            break
        end
    end
    if phonex == nil then
        error("Cannot find telephone in world: " .. dataworld, 2)
    end
    local tx = math.floor(phonex)
    local ty = math.floor(phoney)
    while reconnect(dataworld, dataworldid, true) and inventory:getItemCount(DL) >= 100 do
        if expirytime ~= 0 and os.time() > expirytime then expired = true return end
        if not bot:isInTile(phonex, phoney) then
            bot:findPath(phonex, phoney)
            sleep(250)
        end
        if bot:isInTile(phonex, phoney) then
            bot:sendPacket(2, "action|dialog_return\ndialog_name|phonecall\nbuttonClicked|end_dialog")
            sleep(200)
            bot:wrench(phonex, phoney)
            sleep(1500)
            bot:sendPacket(2, "action|dialog_return\ndialog_name|phonecall\ntilex|"..tx.."|\ntiley|"..ty.."|\nnum|-2|\ndial|53785\n")
            local salesManFound = false
            local salesNum = "53785"
            local attempts = 0
            while attempts < 20 do
                sleep(250)
                local currentDlg = getDialog():get():dump()
                if currentDlg and (currentDlg:find("53785") or currentDlg:find("Sales-Man")) then
                    salesManFound = true
                    local n = currentDlg:match("embed_data|num|(-?%d+)")
                    if n then salesNum = n end
                    break
                else
                    print("Bekleniyor... Görülen: " .. (currentDlg and currentDlg:match("add_label_with_icon|big|`w([^`]+)") or "Nil"))
                end
                attempts = attempts + 1
            end
            if salesManFound then
                sleep(1000)
                bot:sendPacket(2, "action|dialog_return\ndialog_name|phonecall\ntilex|"..tx.."|\ntiley|"..ty.."|\nnum|"..salesNum.."|\nbuttonClicked|chc5\n")
                local confirmFound = false
                local confirmNum = "-34"
                attempts = 0
                while attempts < 20 do
                    sleep(250)
                    local currentDlg = getDialog():get():dump()
                    if currentDlg and (currentDlg:find("sell you") or currentDlg:find("100 Diamond Lock")) then
                        confirmFound = true
                        local n = currentDlg:match("embed_data|num|(-?%d+)")
                        if n then confirmNum = n end
                        break
                    end
                    attempts = attempts + 1
                end
                if confirmFound then
                    sleep(1000)
                    bot:sendPacket(2, "action|dialog_return\ndialog_name|phonecall\ntilex|"..tx.."|\ntiley|"..ty.."|\nnum|"..confirmNum.."|\nbuttonClicked|chc0\n")
                    sleep(1000)
                else
                    print("Onay dialogu gelmedi.")
                end
            else
                print("Sales-Man dialogu tespit edilemedi.")
            end
        end    
        sleep(Wait_User)
    end
end

local function getVaultCoordinats()
    local tiles = world:getTiles()
    for i = 1, #tiles do
        local tile = tiles[i]
        if tile.fg == 8878 then
            local vaultxx, vaultyy = tile.x, tile.y
            for dx = -1, 1 do
                for dy = -1, 1 do
                    if not (dx == 0 and dy == 0) then
                        local checkx = vaultxx + dx
                        local checky = vaultyy + dy
                        if isPathFindable(checkx, checky) then
                            return vaultxx, vaultyy, checkx, checky
                        end
                    end
                end
            end
        end
    end
    return nil, nil, nil, nil
end

local function getVaultData(dialog)
    local v = { [BGL] = 0, [DL] = 0, totalDL = 0 }
    local rawList = dialog:match("add_searchable_item_list|([^|]+)|")
    if rawList then
        for id, count in rawList:gmatch("(%d+),(%d+)") do
            id = tonumber(id)
            count = tonumber(count)    
            if id == BGL then
                v[BGL] = v[BGL] + count
            elseif id == DL then
                v[DL] = v[DL] + count
            end
        end
    end 
    v.totalDL = (v[BGL] * 100) + v[DL]
    return v
end

local function waitForInvChange(itemID, targetCount)
    local timeout = os.time() + 5
    while inventory:getItemCount(itemID) ~= targetCount do
        if os.time() > timeout then
            return false
        end
        sleep(250)
    end
    return true
end

local function waitForInvChange2(targetCount1, targetCount2)
    local timeout = os.time() + 10
    while waitUntilOnline() and os.time() < timeout do
        if inventory:getItemCount(BGL) == targetCount1 or inventory:getItemCount(DL) == targetCount2 then
            return true
        end
        sleep(250)
    end
    return false
end

local function breakBGL(datacount)
    local datatarget = datacount - 1
    local p = GameUpdatePacket.new()
    p.type = 10
    p.int_data = BGL
    bot:sendRaw(p)
    sleep(750)
    return waitForInvChange(BGL, datatarget)
end

local function safeTake(dataid, datacount, datatarget)
    if bot.status ~= 1 or not bot:isInTile(checkx, checky) then return false end
    bot:sendPacket(2,
        "action|dialog_return\n"..
        "dialog_name|storageboxxtreme\n"..
        "tilex|"..vaultx.."|\n"..
        "tiley|"..vaulty.."|\n"..
        "itemid|"..dataid.."|\n"..
        "itemcount|"..datacount.."|\n"..
        "buttonClicked|do_take"
    )
    sleep(750)
    return waitForInvChange(dataid, datatarget)
end

local function safePut(dataid, datacount, datatarget)
    if bot.status ~= 1 then return false end
    bot:sendPacket(2, "action|drop\n|itemID|" .. dataid)
    sleep(200)
    bot:sendPacket(2,
        "action|dialog_return\n"..
        "dialog_name|drop_item\n"..
        "itemID|"..dataid.."|\n"..
        "count|"..datacount
    )
    sleep(750)
    return waitForInvChange(dataid, datatarget)
end

local function safeVaultProcess(targetDL)
    local worldempty, completed = false, false
    ::retrytake::
    local dialogText, failedvault = nil, false
    if expirytime ~= 0 and os.time() > expirytime then expired = true return end
    warpWorld(vaultworld, vaultworldid, true)
    if stopped or expired then return end
    if vaultx == 100 and not nuked and not wrongdoor and not level then
        vaultx, vaulty, checkx, checky = getVaultCoordinats()
        if vaultx == nil then
            removeEvent(Event.variantlist)
            error("Vault coordinats cannot found!", 2)
        end
    end
    if nuked or wrongdoor or level or worldempty then
        local reason = nuked and "Vault World Nuked!" or wrongdoor and "Vault World Has Wrong Door!" or level and "Vault World Has Level Limit!" or "Vault World Has No Locks Left!"
        customPrint(reason .. ": " .. vaultworld)
        SendWebhook(reason .. ": " .. vaultworld, Webhook_Url)
        stopped = true
        return
    end
    if not bot:isInTile(checkx, checky) then
        bot:findPath(checkx, checky)
        local walkWait = 0
        while not bot:isInTile(checkx, checky) and walkWait < 20 do
            sleep(500)
            walkWait = walkWait + 1
        end
    end
    getDialog():clear()
    local waitAttempts = 0
    while bot:isInTile(checkx, checky) do
        if expirytime ~= 0 and os.time() > expirytime then expired = true return end
        bot:wrench(vaultx, vaulty)
        sleep(1500)
        local currentdialog = getDialog():get():dump()
        if #currentdialog > 0 then
            dialogText = currentdialog
            break
        end
    end
    if dialogText then
        local currentbgl, currentdl = inventory:getItemCount(BGL), inventory:getItemCount(DL)
        local currenttotal = (currentbgl * 100) + currentdl
        local missingdl = targetDL - currenttotal
        local vault = getVaultData(dialogText) 
        sleep(500)
        if vault.totalDL < missingdl then
            worldempty = true
        else
            if missingdl > 0 then
                local bglToTake = math.floor(missingdl / 100)
                local actualBGLTake = math.min(vault[BGL], bglToTake)
                if actualBGLTake > 0 then
                    local datatarget = currentbgl + actualBGLTake
                    if not safeTake(BGL, actualBGLTake, datatarget) then
                        failedvault = true
                    else
                        missingdl = missingdl - (actualBGLTake * 100)
                        vault[BGL] = vault[BGL] - actualBGLTake
                        currentbgl = datatarget
                    end
                end
            end     
            if not failedvault and missingdl > 0 then
                if vault[DL] > 0 then
                    local targettake = math.min(vault[DL], missingdl)
                    if targettake > 200 then targettake = 200 end
                    if targettake + currentdl > 200 then
                        local tcount = targettake + currentdl - 200
                        targettake = targettake - tcount
                    end
                    local datatarget = currentdl + targettake
                    if not safeTake(DL, targettake, datatarget) then
                        failedvault = true
                    else
                        missingdl = missingdl - targettake
                        currentdl = datatarget
                        if currentdl >= 100 then 
                            shouldconvert = true
                        end
                    end
                end
                if not failedvault and not shouldconvert and missingdl > 0 then
                    if vault[BGL] > 0 then
                        local datatarget = currentbgl + 1
                        if not safeTake(BGL, 1, datatarget) then
                            failedvault = true
                        else
                            missingdl = missingdl - 100
                            currentbgl = datatarget
                        end
                    end          
                    if missingdl > 0 then
                        failedvault = true
                        customPrint("Something went wrong please control vaults! World: " .. vaultworld)
                    end
                end
            end
            if not failedvault and not shouldconvert and missingdl < 0 then
                if targetDL == 0 and currentdl >= 100 then
                    shouldconvert = true
                else
                    local absNum = math.abs(missingdl)
                    if absNum >= 100 then
                        absNum = absNum % 100
                    end
                    if currentdl < absNum then
                        if not breakBGL(currentbgl) then
                            failedvault = true
                            customPrint("Cannot break BGL probably bad servers trying again...")
                        end
                    end
                    if not failedvault then
                        if absNum > 0 then
                            local datatarget = currentdl - absNum
                            if not safePut(DL, absNum, datatarget) then
                                failedvault = true
                                customPrint("DEBUG: safePut(DL) failed! absNum="..absNum.." datatarget="..datatarget.." current="..inventory:getItemCount(DL))
                            else
                                missingdl = missingdl + absNum
                            end
                        end
                        if missingdl < 0 then 
                            local targetput = math.floor(math.abs(missingdl) / 100)
                            if targetput > 0 then
                                datatarget = currentbgl - targetput
                                if not safePut(BGL, targetput, datatarget) then
                                    failedvault = true
                                    customPrint("DEBUG: safePut(BGL) failed! targetput="..targetput.." datatarget="..datatarget.." current="..inventory:getItemCount(BGL))
                                else
                                    missingdl = missingdl + (targetput * 100)
                                end
                            end
                        end
                    end
                end
            end
            if not failedvault and not shouldconvert then
                completed = true
            end
        end
    end
    if shouldconvert then
        shouldconvert = false
        convertBGL(depoworld, "NONE")
    end
    if failedvault then
        sleep(2000)
        failedvault = false
    end
    if completed then
        customPrint("Successfully processed " .. targetDL .. "x diamond locks!")
        removeEvent(Event.variantlist)
        return
    end
    goto retrytake
end

local function consoleFind(datatext, datatimeout)
    while os.time() < datatimeout do
        local console = bot:getConsole()
        for _, text in pairs(console.contents) do
            if text:find(datatext) or datatext == "trading with" and text:find("cancel your current") then
                return true
            end
        end
        sleep(250)
    end
    return false
end

local function isTradeHappened(datatimeout)
    while os.time() < datatimeout do
        local console = bot:getConsole()
        for _, text in pairs(console.contents) do
            if (text:find(botname, 1, true) and text:find(" traded ", 1, true) and text:find(" to ", 1, true)) or text:find("trade canceled by")  then
                return true
            end
        end
        sleep(250)
    end
    return false
end

local function tradeProcess(targetGrowID, targetAmount, mode)
    local completed = false
    if not bot:getConsole().enabled then
        bot:getConsole().enabled = true
        sleep(300)
    end
    if bot.auto_collect then
        bot.auto_collect = false
        sleep(300)
    end
    convertBGL(depoworld, "NONE")
    local tradeAttempts = 0
    while not completed and reconnect(depoworld, "NONE", false) do
        local dialogText = nil
        if expirytime ~= 0 and os.time() > expirytime then expired = true return end
        local cancelPath = Target_Path:gsub("%.json$", "_cancel.txt")
        if cancelPath then
            local cf = io.open(cancelPath, "r")
            if cf then
                cf:close()
                customPrint("Cancel file detected. Assuming cancelled by user.")
                return
            end
        end
        local players = world:getPlayers()
        for i = 1, #players do
            local player = players[i]
            -- Strip all color codes (` followed by anything) and special characters
            local cleanPlayer = player.name:gsub("`.", ""):gsub("[^a-zA-Z0-9]", "")
            local cleanTarget = targetGrowID:gsub("`.", ""):gsub("[^a-zA-Z0-9]", "")
            if cleanPlayer:lower() == cleanTarget:lower() then
                bot:getConsole():clear()
                local tradeName = player.name:gsub("`.", ""):gsub("^Dr%.", "")
                bot:say("/trade " .. tradeName)
                sleep(1000)
                local tradesuccess = consoleFind("trading with", os.time() + 5)
                if not tradesuccess then
                    tradeAttempts = tradeAttempts + 1
                    if tradeAttempts >= 10 then
                        customPrint("Player failed to accept trade 10 times. Assuming AFK.")
                        expired = true
                        return
                    end
                else
                    tradeAttempts = 0
                    local dlcount, bglcount = inventory:getItemCount(DL), inventory:getItemCount(BGL)
                    if mode == "withdraw" then
                        local targetBGL, targetDL = math.floor(targetAmount / 100), targetAmount % 100
                        if dlcount < targetDL then
                            if not breakBGL(bglcount) then
                                customPrint("BGL break failed trying again!")
                                sleep(3000)
                                break
                            end
                            bglcount = bglcount - 1
                            dlcount = dlcount + 100
                        end
                        local itemlist = {} 
                        if targetBGL > 0 and targetDL > 0 then
                            itemlist = {BGL, DL}
                        elseif targetBGL > 0 then
                            itemlist = {BGL}
                        elseif targetDL > 0 then
                            itemlist = {DL}
                        else
                            customPrint("Something went wrong in trade trying again!")
                            sleep(3000)
                        end
                        local putsuccess = false
                        for i, targetid in ipairs(itemlist) do
                            bot:getConsole():clear()
                            local targetcount = targetid == BGL and targetBGL or targetDL
                            bot:say("/trade " .. tradeName)
                            sleep(500)
                            if not consoleFind("cancel your current", os.time() + 5) then break end
                            bot:sendPacket(2, "action|mod_trade\nitemID|" .. targetid)
                            sleep(300)
                            bot:sendPacket(2, "action|dialog_return\ndialog_name|trade_item\nitemID|" .. targetid .. "\ncount|" .. targetcount)
                            sleep(1000)
                            putsuccess = consoleFind("deal has changed", os.time() + 5)
                            if not putsuccess then
                                customPrint("Something went wrong in trade trying again!")
                                sleep(3000)
                                break
                            end
                        end
                        if not putsuccess then break end
                    end
                    sleep(500)
                    getDialog():clear()
                    local waitAttempts = 0
                    while true do
                        if expirytime ~= 0 and os.time() > expirytime then expired = true return end
                        bot:sendPacket(2, "action|trade_accept\nstatus|1")
                        sleep(2000)
                        local currentdialog = getDialog():get():dump()
                        if #currentdialog > 0 then
                            dialogText = currentdialog
                            break
                        elseif waitAttempts % 3 == 0 then
                            bot:getConsole():clear()
                            bot:say("/trade " .. tradeName)
                            sleep(250)
                            if not consoleFind("cancel your current", os.time() + 5) then break end
                        end
                        waitAttempts = waitAttempts + 1
                    end
                    if dialogText then
                        local tradedbgl, tradeddl = 0, 0
                        local foreignitem, tradehappened = false, false
                        for rawlabel in dialogText:gmatch("add_label_with_icon|small|([^|]+)|") do
                            local quantity = 1
                            local name = rawlabel
                            
                            local q1, n1 = rawlabel:match("%(`w(%d+)``%) (.*)")
                            if q1 then
                                quantity = tonumber(q1)
                                name = n1
                            else
                                local q2, n2 = rawlabel:match("^(%d+) (.*)")
                                if q2 then
                                    quantity = tonumber(q2)
                                    name = n2
                                else
                                    local q3, n3 = rawlabel:match("^`w(%d+)`` (.*)")
                                    if q3 then
                                        quantity = tonumber(q3)
                                        name = n3
                                    end
                                end
                            end

                            if name == "Blue Gem Lock" then
                                tradedbgl = quantity
                            elseif name == "Diamond Lock" then
                                tradeddl = quantity
                            else
                                foreignitem = true
                            end
                        end
                        local total_value_in_dls = tradeddl + (tradedbgl * 100)
                        sleep(500)
                        local isValidTrade = false
                        if targetMode == "addbalance" then
                            if total_value_in_dls > 0 and not foreignitem then
                                isValidTrade = true
                                _G.ModifiedTargetAmount = total_value_in_dls
                                targetAmount = total_value_in_dls -- Update local argument for inside this function
                            end
                        else
                            if total_value_in_dls == targetAmount and not foreignitem then
                                isValidTrade = true
                            end
                        end
                        
                        if isValidTrade then
                            bot:sendPacket(2, "action|dialog_return\ndialog_name|trade_confirm\nbuttonClicked|accept")
                            local termimatecount, acceptedbyother = 0, false
                            while bot:isInWorld() and not isTradeHappened(os.time() + 5) do
                                if not acceptedbyother then
                                    local console = bot:getConsole()
                                    for _, text in pairs(console.contents) do
                                        if text:find("accepted by other player") then
                                            acceptedbyother = true         
                                        end
                                    end
                                end
                                if acceptedbyother then
                                    bot:sendPacket(2, "action|dialog_return\ndialog_name|trade_confirm\nbuttonClicked|accept")
                                else
                                    bot:say("Accept or process will terminated.")
                                    termimatecount = termimatecount + 1
                                    if termimatecount >= 2 then expired = true return end
                                end
                            end
                            local targetbgl, targetdl
                            if mode == "withdraw" then
                                targetbgl = bglcount - tradedbgl
                                targetdl  = dlcount - tradeddl
                            else
                                targetbgl = bglcount + tradedbgl
                                targetdl = dlcount + tradeddl
                            end
                            if waitForInvChange2(targetbgl, targetdl) then
                                completed = true
                            else
                                expired = true
                                return
                            end
                        else
                            bot:sendPacket(2, "action|dialog_return\ndialog_name|trade_confirm\nbuttonClicked|back")
                            if not consoleFind("Trade canceled by", os.time() + 5) then
                                bot:disconnect()
                                waitUntilOnline()
                                break
                            end
                            if foreignitem then
                                bot:say("Please do not put item except BGL or DL!")
                            else
                                bot:say("Please put only total worth of will add balanced dls")
                            end
                        end    
                        break
                    end
                end
            end
        end
        sleep(Wait_User)
    end
    if nuked or level then
        local reason = nuked and "Deposit World Nuked!" or "Deposit World Has Level Limit!"
        customPrint(reason .. ": " .. depoworld)
        SendWebhook(reason .. ": " .. depoworld, Webhook_Url)
        stopped = true
    end
    return targetAmount
end

local function getJobDetailsFromJSON()
    local file, err = io.open(Target_Path, "r")
    if not file then 
        customPrint("File Read Error: " .. tostring(err))
        return nil 
    end
    local content = file:read("*a")
    file:close()
    if content == nil or content == "" then return nil end
    local success, data = pcall(json.decode, content)
    if not success or type(data) ~= "table" then return nil end
    if next(data) == nil then return nil end
    
    if data.active_bot and data.active_bot.name:lower() == botname:lower() then
        if data.details then
            local d = data.details
            if d.mode and d.growid and d.amount ~= nil and d.userid and d.start_time then
                return {
                    mode    = d.mode,
                    start   = d.start_time,
                    growid  = d.growid,
                    amount  = tonumber(d.amount),
                    userid  = tostring(d.userid),
                    world   = d.world
                }
            else
                customPrint("JSON Rejected: Missing details fields. mode=" .. tostring(d.mode) .. " growid=" .. tostring(d.growid) .. " amount=" .. tostring(d.amount) .. " userid=" .. tostring(d.userid) .. " start=" .. tostring(d.start_time))
            end
        else
            customPrint("JSON Rejected: Missing 'details' table.")
        end
    else
        customPrint("JSON Rejected: Bot name mismatch. Expected: " .. tostring(botname) .. " | Got: " .. tostring(data.active_bot and data.active_bot.name))
    end
    return nil
end

local function fileExists(path)
    local f = io.open(path, "r")
    if f then
        local content = f:read("*a")
        f:close()
        if not content then return false end
        local cleanContent = content:gsub("%s+", "")
        if cleanContent == "{}" or cleanContent == "" then
            return false
        end
        return true
    end
    return false
end

setBots()
while not stopped do
    local datalist = nil
    local readyPath = Target_Path:gsub("%.json$", "_ready.txt")
    local rf = io.open(readyPath, "w")
    if rf then rf:write("ready") rf:close() end

    changeStatus("Waiting User")
    customPrint("Searching user... Looking in: " .. Target_Path)
    local targetTime = os.time() + (60 * Save_Vault)
    while not datalist do
        if targetMode == "addbalance" and os.time() > targetTime then break end
        datalist = getJobDetailsFromJSON()
        if not datalist then
            sleep(Wait_User)
        end
    end
    os.remove(readyPath)
    if datalist then
        changeStatus("User Found")
        expirytime         = 300 + datalist.start
        targetMode         = datalist.mode
        local targetGrowID = datalist.growid
        local targetAmount = datalist.amount
        local targetUserID = datalist.userid
        if datalist.world and datalist.world ~= "" then
            depoworld = datalist.world:upper()
        end
        customPrint("Successfully found user!\nUserID: " .. targetUserID .. "\nGrowID: " .. targetGrowID .. "\nAmount: " .. targetAmount .. " DL\nMode: " .. targetMode .. "\nWorld: " .. depoworld)
        SendWebhook("Successfully found user!\n**UserID:** " .. targetUserID .. "\n**GrowID:** " .. targetGrowID .. "\n**Amount:** " .. targetAmount .. " DL\n**Mode:** " .. targetMode)
        if not waitUntilOnline() then break end
        if not expired then
            local currentBGL, currentDL = inventory:getItemCount(BGL), inventory:getItemCount(DL)
            local currentTotal = (currentBGL * 100) + currentDL
            if targetMode == "withdraw" then
                local missingDL = targetAmount - currentTotal
                if missingDL > 0 then
                    changeStatus("Preparing Locks")
                    safeVaultProcess(targetAmount)
                    if stopped then changeStatus("EXPIRED:" .. targetUserID) break end
                end         
            else
                if currentTotal > 0 then
                    changeStatus("Clearing Inventory")
                    safeVaultProcess(0)
                    if stopped then changeStatus("EXPIRED:" .. targetUserID) break end
                end
            end
            if not expired then
                changeStatus("Ready For Trade")
                _G.ModifiedTargetAmount = nil
                tradeProcess(targetGrowID, targetAmount, targetMode)
                if _G.ModifiedTargetAmount then
                    targetAmount = _G.ModifiedTargetAmount
                end
            end
        end
        if not expired then
            changeStatus("SUCCESS:" .. targetUserID)
            customPrint("Transaction Successful!\nUserID: " .. targetUserID .. "\nGrowID: " .. targetGrowID .. "\nAmount: " .. targetAmount .. " DL\nMode: " .. targetMode)
            SendWebhook("Transaction Successful!\n**UserID:** " .. targetUserID .. "\n**GrowID:** " .. targetGrowID .. "\n**Amount:** " .. targetAmount .. " DL\n**Mode:** " .. targetMode)
        else
            changeStatus("EXPIRED:" .. targetUserID)
            customPrint("Transaction Expired!\nUserID: " .. targetUserID .. "\nGrowID: " .. targetGrowID .. "\nAmount: " .. targetAmount .. " DL\nMode: " .. targetMode)
            SendWebhook("Transaction Expired!\n**UserID:** " .. targetUserID .. "\n**GrowID:** " .. targetGrowID .. "\n**Amount:** " .. targetAmount .. " DL\n**Mode:** " .. targetMode)
        end
        local statusFile = Target_Path:gsub("%.json$", "_status.json")
        local sf = io.open(statusFile, "w")
        if sf then
            if not expired then
                sf:write('{"status":"SUCCESS","userid":"' .. targetUserID .. '","amount":' .. targetAmount .. '}')
            else
                sf:write('{"status":"EXPIRED","userid":"' .. targetUserID .. '","amount":0}')
            end
            sf:close()
        end
        while fileExists(Target_Path) do sleep(500) end
        os.remove(statusFile)
        expirytime = 0
        if expired and targetMode == "withdraw" then
            if not waitUntilOnline() then break end
            local currentBGL, currentDL = inventory:getItemCount(BGL), inventory:getItemCount(DL)
            local currentTotal = (currentBGL * 100) + currentDL
            if currentTotal > 0 then
                changeStatus("Clearing Inventory")
                safeVaultProcess(0)
                if stopped then break end
            end
        end
        expired = false
        bot:leaveWorld()
        sleep(3000)
    else
        if not waitUntilOnline() then break end
        local currentBGL, currentDL = inventory:getItemCount(BGL), inventory:getItemCount(DL)
        local currentTotal = (currentBGL * 100) + currentDL
        if currentTotal > 0 then
            changeStatus("Clearing Inventory")
            safeVaultProcess(0)
            if stopped then break end
            targetMode = ""
            bot:leaveWorld()
            sleep(3000)
        end
    end
end

--=== STOP SCRIPT ===--
bot.auto_reconnect = false
sleep(1000)
bot:getConsole().enabled = false
sleep(1000)
bot:disconnect()
