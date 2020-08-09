assistantIsPlaying = false;
client_id = -1;

function initWebsocket() {
  var scheme = window.location.protocol == "https:" ? 'wss://' : 'ws://';
  var webSocketUri = scheme
    + window.location.hostname
    + (location.port ? ':' + location.port : '')
    + '/chat';

  websocket = new WebSocket(webSocketUri);

  websocket.onopen = function () {
    if (client_id == -1) {
      client_id = Math.floor(Math.random() * 9999) + 9999;
    }
    websocket.send("____CLIENT_ID____" + client_id);
    $("#client_id").html(client_id);
    console.log('Connected');
    $("#enemy_data").css("border", "1px solid green");
  };

  websocket.onclose = function () {
    console.log('Closed');
    $("#enemy_data").css("border", "1px solid #FFF");
    initWebsocket();
  };

  websocket.onmessage = function (e) {
    var text = e.data;
    console.log(text);

    if (text.startsWith("___SET_NAME___")) {
      text = text.replace("___SET_NAME___", "");
      $("#search_text").val(text);
      filter_enemies();
    }

  };

  websocket.onerror = function (e) {
    console.log(e);
  };
}

