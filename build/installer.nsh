 !macro customInstall
   WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "客服消息提醒" "%localappdata%\Programs\message-reminder\message-reminder.exe"
 !macroend

 !macro customUnInstall
   DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "%localappdata%\Programs\message-reminder\message-reminder.exe"
 !macroend