import re

with open('index.ts', 'r') as f:
    content = f.read()

replacements = [
    (
        "rakebackAmount = Math.floor(amount * getVIPRakebackPercentage(user.totalWagered)); // dynamic rakeback",
        "rakebackAmount = Math.floor(amount * getVIPRakebackPercentage(user.totalWagered)); // dynamic rakeback\n        await processAffiliateReward(tx, user.referredBy, amount);"
    ),
    (
        "rakebackAmount = amount * getVIPRakebackPercentage(user.totalWagered);\n        \n        const updatedUser",
        "rakebackAmount = amount * getVIPRakebackPercentage(user.totalWagered);\n        await processAffiliateReward(tx, user.referredBy, amount);\n        const updatedUser"
    ),
    (
        "rakebackAmount = Math.floor(amount * getVIPRakebackPercentage(user.totalWagered));\n\n        const updatedUser = await tx.user.update({",
        "rakebackAmount = Math.floor(amount * getVIPRakebackPercentage(user.totalWagered));\n        await processAffiliateReward(tx, user.referredBy, amount);\n\n        const updatedUser = await tx.user.update({"
    ),
    (
        "rakebackAmount = Math.floor(game.betAmount * getVIPRakebackPercentage(user!.totalWagered));\n\n          const newXp",
        "rakebackAmount = Math.floor(game.betAmount * getVIPRakebackPercentage(user!.totalWagered));\n          await processAffiliateReward(tx, user!.referredBy, game.betAmount);\n\n          const newXp"
    ),
    (
        "rakebackAmount = Math.floor(game.betAmount * getVIPRakebackPercentage(user!.totalWagered));\n\n        const newXp",
        "rakebackAmount = Math.floor(game.betAmount * getVIPRakebackPercentage(user!.totalWagered));\n        await processAffiliateReward(tx, user!.referredBy, game.betAmount);\n\n        const newXp"
    ),
    (
        "rakebackAmount = isBorrow ? 0 : Math.floor(selectedCase.price * getVIPRakebackPercentage(user.totalWagered));\n            if (rakebackAmount > 0) {",
        "rakebackAmount = isBorrow ? 0 : Math.floor(selectedCase.price * getVIPRakebackPercentage(user.totalWagered));\n            if (!isBorrow) await processAffiliateReward(tx, user.referredBy, selectedCase.price);\n            if (rakebackAmount > 0) {"
    ),
    (
        "rakebackAmount = Math.floor(finalBetAmount * getVIPRakebackPercentage(u.totalWagered));\n\n              // Handle standard provably fair setup",
        "rakebackAmount = Math.floor(finalBetAmount * getVIPRakebackPercentage(u.totalWagered));\n              await processAffiliateReward(tx, u.referredBy, finalBetAmount);\n\n              // Handle standard provably fair setup"
    ),
    (
        "rakebackBalance: { increment: Math.floor(entryFee * getVIPRakebackPercentage(user.totalWagered)) }\n          });",
        "rakebackBalance: { increment: Math.floor(entryFee * getVIPRakebackPercentage(user.totalWagered)) }\n          });\n          await processAffiliateReward(tx, user.referredBy, entryFee);"
    ),
    (
        "rakebackBalance: { increment: Math.floor(battle.entryFee * getVIPRakebackPercentage(user.totalWagered)) }\n        });",
        "rakebackBalance: { increment: Math.floor(battle.entryFee * getVIPRakebackPercentage(user.totalWagered)) }\n        });\n        await processAffiliateReward(tx, user.referredBy, battle.entryFee);"
    )
]

for old, new_str in replacements:
    content = content.replace(old, new_str)

with open('index.ts', 'w') as f:
    f.write(content)

