 !macro customInstall
  CreateShortCut "$SMPROGRAMS\Startup\消息提醒.lnk" "$INSTDIR\message-reminder.exe"
 !macroend

 !macro customUnInstall
   Delete "$SMSTARTUP\Startup\消息提醒.lnk"
 !macroend