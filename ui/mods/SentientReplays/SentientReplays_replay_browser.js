// Sentient Replays filters the replay list
// to show only all-human games.
// Thus, you don't have to scroll through a bunch
// of AI games and Galactic Wars to find something
// interesting to watch :-)

/// --- debug function ---
model.showMembers = function (obj) {
  var result = [];
  for (var id in obj) {
    try {
        console.log(id + ": " + obj[id].toString());
    } catch (err) {
      console.log(id + ": inaccessible");
    }
  }
  return result;
}

// ----------------- HTML Hackery -----------------------
// inject two checkboxes in the search div, 
// one to "Show Galactic Wars" and the other to "Show AI Games".
// data-bind these to watched variables so they update the 
// list when clicked (see below)
var SentientReplaysInjectedHTML = '\
<div class="form-group" style="margin-top:5px; margin-left:5px;">\
  <label data-bind="click: function () { model.ShowGalacticWars(!model.ShowGalacticWars());}">\
    <input type="checkbox"  style="pointer-events: none !important;" data-bind="checked: model.ShowGalacticWars"  >Show Galactic Wars</>\
  </label>\
</div>\
<div class="form-group">\
    <label>\
    Minimum Humans\
    </label>\
    <select class="selectpicker form-control" id="replay-list-min-humans" name="minimum-humans" data-bind="selectPicker: model.minHumans">\
        <option value="0">0</option>\
        <option value="1">1</option>\
        <option value="2">2</option>\
        <option value="3">3</option>\
        <option value="4">4</option>\
        <option value="5">5</option>\
        <option value="6">6</option>\
    </select>\
</div>\
<div class="form-group">\
    <label>\
    Maximum AI \
    </label>\
    <select class="selectpicker form-control" id="replay-list-max-ai" name="maximum-ai" data-bind="selectPicker: model.maxAI">\
        <option value="0">0</option>\
        <option value="1">1</option>\
        <option value="2">2</option>\
        <option value="3">3</option>\
        <option value="4">4</option>\
        <option value="10000">Any</option>\
    </select>\
</div>\
'
// there's no id for the search div, so let's guess it will always be the first
// of its class on the page (heh, every HTML/js code must have some stupid hack, no?)
$(".form-group").first().append(SentientReplaysInjectedHTML);


// ----------------- javascript Hackery -----------------------
// Create a watched variable for each checkbox
// that also reloads the replay list when clicked.
// These are bound to the checkboxes using the injected HTML above

var callbackFunction = function(gWarEnabled) {
  // the following is defined in the original replay_browser.js file
  model.updateReplayData();
  model.storeSettings();
};

// load and store values
model.loadSettings = function(){
  if ("SentientReplays-ShowGalacticWars" in localStorage)
    model.ShowGalacticWars = ko.observable(decode(localStorage["SentientReplays-ShowGalacticWars"]));
  else
    model.ShowGalacticWars = ko.observable(false);

  if ("SentientReplays-MinimumHumans" in localStorage)
    model.minHumans = ko.observable(decode(localStorage["SentientReplays-MinimumHumans"]));
  else
    model.minHumans = ko.observable(2);

  if ("SentientReplays-MaximumAI" in localStorage)
    model.maxAI = ko.observable(decode(localStorage["SentientReplays-MaximumAI"]));
  else
    model.maxAI = ko.observable(0);
  
  model.ShowGalacticWars.subscribe(callbackFunction);
  model.minHumans.subscribe(callbackFunction);
  model.maxAI.subscribe(callbackFunction);
};

model.storeSettings = function() {
  localStorage["SentientReplays-ShowGalacticWars"] = encode(model.ShowGalacticWars());
  localStorage["SentientReplays-MinimumHumans"] = encode(model.minHumans());
  localStorage["SentientReplays-MaximumAI"] = encode(model.maxAI());
};


// ----------------- Override PA code Hackery -----------------------

// Override the replay_browser.js "filteredGameList()" function
// so that it honors my check boxes above
model.filteredGameList = ko.computed({read: function () {
            var allGames = model.gameList().concat(model.lanGameList());
            var filteredGames = [];
            var selectedGameStillVisible = false;
            
            // for discovering the fields in a game record:
            //model.showMembers (allGames[0]);

            _.forEach(allGames, function(game){

                var matched = true;

                // TODO: add filtering here (see server_browser for examples)

                if (!matched) return;

                // Look for games matching the search string
                if (model.searchFilter().length > 0) {
                    if (game.searchable.indexOf(model.searchFilter().toUpperCase()) === -1) return;
                }

                // Sentient Replays CHANGED CODE START
                  var hasAI = false;
                  var isGalactic = false;
                  var numHumans = 0;
                  var numAI = 0;
                  var numPlayers = 0;
                  
                  // times of 0 seconds can't be watched anyway
                  //if (game.duration.indexOf("0:00") === 0) return;

                  if (game.searchable.indexOf(": Galactic War".toUpperCase()) != -1){
                    if (!model.ShowGalacticWars())
                      return;
                    else
                      isGalactic = true;
                  }
      
                  numHumans = 0;
                  numAI = 0;
                  numPlayers = 0;
                  
                  //console.log(game);
                  //console.log(game.armies);
                  
                  // force a game version, dunno if this fixes a bug where
                  // "My Games Only" creates a blank list, but might as well...
                  if (game.buildVersion != null) {
                    var buildversion = parseInt(game.buildVersion);
                    if (buildversion && buildversion > 72331) {
                      for (var index=0; index < game.armies.length; index++){
                        numPlayers++;
                        if (game.armies[index].name != null) {
                          if (game.armies[index].ai){
                            hasAI = true;
                            numAI++;
                          }
                          else {
                            numHumans++;
                          }
                        }
                      }
                  if (numHumans < parseInt(model.minHumans())) return;
                  if (numAI > parseInt(model.maxAI())) return;
                    
                    }
                  }
                                                  

                // Sentient Replays CHANGED CODE END
                  
                // Is this the currently selected game? If so, we need to retain the selection
                if (!!model.currentSelectedGame() && game.name === model.currentSelectedGame().name) {
                    selectedGameStillVisible = true;
                }

                // If our filters haven't whacked the game from the list, include in our results
                filteredGames.push(game);
                
            });

            if (!selectedGameStillVisible) model.setSelected(null);

            return filteredGames;

        }, deferEvaluation: true});


/////////// STARTUP
model.loadSettings();
