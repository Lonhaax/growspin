local fs = require('fs');
let code = fs.readFileSync('procecssFIX.lua', 'utf8');
code = code.replace(
    'if not safePut(BGL, targetput, datatarget) then\n                                    failedvault = true',
    'if not safePut(BGL, targetput, datatarget) then\n                                    failedvault = true\n                                    customPrint("safePut BGL failed! targetput="..targetput.." datatarget="..datatarget.." current="..inventory:getItemCount(BGL))\n'
);
fs.writeFileSync('procecssFIX.lua', code);
