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
<input type="checkbox"  data-bind="checked: model.ShowGalacticWars"  >Show Galactic Wars</>\
<br/>\
<input type="checkbox"  data-bind="checked: model.ShowAIGames" >Show AI Games</>\
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
};

model.ShowGalacticWars = ko.observable(false);
model.ShowGalacticWars.subscribe(callbackFunction);

model.ShowAIGames = ko.observable(false);
model.ShowAIGames.subscribe(callbackFunction);

// ----------------- Override PA code Hackery -----------------------

// Override the replay_browser.js "filteredGameList()" function
// so that it honors my check boxes above
model.filteredGameList = ko.computed({read: function () {
            var allGames = model.gameList().concat(model.lanGameList());
            var filteredGames = [];
            var selectedGameStillVisible = false;
            //model.showMembers (allGames[0]);

            _.forEach(allGames, function(game){

                var matched = true;

                // TODO: add filtering here (see server_browser for examples)

                if (!matched) return;
                

                
                // CHANGED CODE START
                  // These actually should access proper fields in the game
                  // record, but I have a total lack of knowledge how to do that.
                  // So, just filter based on text description.
                  
                  // times of 0 seconds can't be watched anyway
                  if (game.duration.indexOf("0:00") === 0) return;
                  
                  if (!model.ShowGalacticWars()) {
                    if (game.searchable.indexOf("Galactic War".toUpperCase()) != -1) return;
                  }
                
                  if (!model.ShowAIGames()) {
                    if (game.searchable.indexOf("AI)".toUpperCase()) != -1) return;
                  }
                // CHANGED CODE END
                                
                // Look for games matching the search string
                if (model.searchFilter().length > 0) {
                    if (game.searchable.indexOf(model.searchFilter().toUpperCase()) === -1) return;
                }

                // Is this the currently selected game? If so, we need to retain the selection
                if (!!model.currentSelectedGame() && game.name === model.currentSelectedGame().name) {
                    selectedGameStillVisible = true;
                }

                // If our filters haven't whacked the game from the list, include in our results
                filteredGames.push(game);
                
                ///for (var army in game.armies) {
                ///      model.showMembers(army);
                ///}
            });

            if (!selectedGameStillVisible) model.setSelected(null);

            return filteredGames;

        }, deferEvaluation: true});