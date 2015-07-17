import A11yError from 'ember-accessibility-automation/utils/a11y-error';

/**
 * Variable to ensure that the initializer is only ran once. Though in this
 * particular case, running more than once shouldn't cause side-effects.
 * @type {Boolean}
 */
let hasRan = false;

export function initialize(application) {
  if (hasRan) { return; }

  Ember.Component.reopen({
    /**
     * Registers an accessibility audit to run on any render of the component.
     * @private
     * @return {Void}
     */
    _registerAxeAudit: Ember.on('init', function() {
      this.addCallback(this.audit);
    }),

    /**
     * An optional callback to process the results from the a11yCheck.
     * @public
     * @type {Function}
     */
    axeCallback: undefined,

    /**
     * An optional options object to be used in a11yCheck.
     * @public
     * @type {Object}
     */
    axeOptions: undefined,

    /**
     * Runs the axe a11yCheck audit and logs any violations to the console. It
     * then passes the results to {@link axeCallback} if one is defined.
     * @public
     * @return {Void}
     */
    audit() {
      axe.a11yCheck(this.$(), this.axeOptions, (results) => {
        // Violations is an array of all failed tests
        let violations = results.violations;
        for (let i = 0, l = violations.length; i < l; i++) {
          let violation = violations[i];

          A11yError.throw(`Violation #${i+1}: ${violation.help}`, violation);

          // Array of elements that violated the test
          let nodes = violation.nodes;
          for (let j = 0, k = nodes.length; j < k; j++) {
            let node = nodes[i];

            // Highlights the targeted node that failed the test and displays
            // a message as well as custom class to select issues of this type
            this.highlightIssue(node.target.join(','), violation.help, `axe-issue_${violation.id}`);
          }
        }

        if (this.axeCallback) {
          Ember.assert('axeCallback should be a function.', typeof this.axeCallback === 'function');
          this.axeCallback(results);
        }
      });
    }
  });

  hasRan = true;
}

export default {
  name: 'axe-component',
  initialize
};
