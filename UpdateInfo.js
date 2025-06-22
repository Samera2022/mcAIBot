const version_0_0_1 = new Version(true,"0.0.1","2025-06-17 08:25",
    "# [Added]\n" +
    " - 加入简单战斗功能（调用包）\n" +
    " - 加入基础寻路功能（使用状态机）\n" + 
    " - 实现bot死亡后依然执行先前命令\n" + 
    " - 仿照Miside Cappie加入compete功能\n" + 
    " - 实现状态机的切换，让bot可连续处理多个任务"
)
const version_0_1_0 = new Version(true,"0.1.0","2025-06-21 09:51",
    "# [Added]\n" +
    " - 增加（稍微）智能的向下掘进功能。\n" + 
    "# [Changed]\n" + 
    " - 重构代码，降低代码耦合度。\n" + 
    "# [Warn]\n" + 
    " - 状态机已删除，需等待后续版本重新加入。"
)
const version_0_1_1 = new Version(true,"0.1.1","2025-06-22 19:44",
    "# [Added]\n" +
    " - 加入LanguageManager与lang文件夹，便于进行本地化处理。"
)
const UpdateInfo = {version_0_0_1};