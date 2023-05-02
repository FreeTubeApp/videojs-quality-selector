import CustomEvents from '../events.js';

class SourceInterceptor {
  constructor(player) {
    this.player = player
    this.begin()
  }
  begin() {
    this.player.use('*', function(player) {
      return {
         setSource: function(playerSelectedSource, next) {
            var sources = player.currentSources(),
                userSelectedSource, chosenSource;

            if (player._qualitySelectorSafeSeek) {
               player._qualitySelectorSafeSeek.onPlayerSourcesChange();
            }

            if (JSON.stringify(sources) != JSON.stringify(player._qualitySelectorPreviousSources)) {
               player.trigger(CustomEvents.PLAYER_SOURCES_CHANGED, sources);
               player._qualitySelectorPreviousSources = sources;
            }

            // There are generally two source options, the one that videojs
            // auto-selects and the one that a "user" of this plugin has
            // supplied via the `selected` property. `selected` can come from
            // either the `<source>` tag or the list of sources passed to
            // videojs using `src()`.

            userSelectedSource = sources.find(function(source) {
               // Must check for boolean values as well as either the string 'true' or
               // 'selected'. When sources are set programmatically, the value will be a
               // boolean, but those coming from a `<source>` tag will be a string.
               return source.selected === true || source.selected === 'true' || source.selected === 'selected';
            })

            chosenSource = userSelectedSource || playerSelectedSource;

            player.trigger(CustomEvents.QUALITY_SELECTED, chosenSource);

            // Pass along the chosen source
            next(undefined, chosenSource);
         }
      }
   })
  }
}

export default SourceInterceptor
