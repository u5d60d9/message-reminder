const {ipcRenderer,ipcMain} = require('electron')

window.ipc = window.ipc || {},
function(n) {
    ipc.messaging = {
        doLogin: function() {
            ipcRenderer.send('login', $("#x_user").val())        
        
    },
    startFill:function(){
      ipcRenderer.send('startfill')        
    },
    fillForm: function(arg){
            $("#x_user").val(arg);
        },

    init: function() {
        $('#btnLogin').click( function () {                
             ipc.messaging.doLogin()
        })
        $(document).ready(()=>{
            ipcRenderer.once('fill', function(event, arg){
                ipc.messaging.fillForm(arg)
            })
            ipc.messaging.startFill()
        });
    }

 };

 n(function() {
     ipc.messaging.init();
 })
}(jQuery);
