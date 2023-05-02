import CustomEvents from '../events.js';
import videojs from 'video.js';
const MenuItem = videojs.getComponent('MenuItem');

/**
 * A MenuItem to represent a video resolution
 * @class QualityOption
 * @augments MenuItem
 */
class QualityOption extends MenuItem {

  /**
   * @inheritdoc
   */
  constructor(player, options) {
      var source = options.source;

      if (!(typeof(source) == 'object' && !!source)) {
        throw new TypeError('was not provided a "source" object, but rather: ' + (typeof source));
      }

      options = Object.assign({
        selectable: true,
        label: source.label
      }, options);

      super(player, options);

      this.source = source;
  }

  /**
   * @inheritdoc
   */
  handleClick(event) {
      super.handleClick(event);
      this.player().trigger(CustomEvents.QUALITY_REQUESTED, this.source);
  }
}

export default QualityOption;
