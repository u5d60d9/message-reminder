let _msglist;
let _lastmsg;


window.msglist = window.msglist || {},
    function (n) {
        
        msglist.latest = {
            get: function () {
                return _lastmsg;
            },
            all:function(){
                return _msglist;
            },
            on_newmsg: function (u,m) {
                //ipcRenderer.send('startfill')
                _lastmsg = m;

                var old=_msglist.get(u)
                if (old  == undefined){                                  
                    old = [];
                }
                old.push(m);
                _msglist.set(u,old)
            },
            remove:function(u){
                _msglist.delete(u)
            },
            clear:function(){
                _msglist.clear()
                // _lastmsg = null;
            },
            init: function () {
                _msglist = new Map();
            }
        };

        n(function () {
            msglist.latest.init();
        })
    }(jQuery);
//useName,Msg