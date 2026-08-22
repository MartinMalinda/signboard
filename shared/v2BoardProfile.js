(function initializeV2BoardProfile(root, factory) {
  const profile = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = profile;
  }
  if (root) {
    root.SignboardV2BoardProfile = profile;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createV2BoardProfileModule() {
  function createDefaultNewBoardV2Profile() {
    return {
      enabled: true,
      profileId: 'default-product',
      version: 1,
      title: 'Product project',
      description: 'A lightweight product-development workspace with shared V2 work signals.',
      stages: {
        inbox: ['To-do'],
        shaping: [],
        ready: [],
        active: ['Doing'],
        review: [],
        blocked: [],
        done: ['Done'],
        dropped: ['XXX-Archive'],
      },
      dashboard: {
        sections: ['priority', 'impact', 'low_hanging_fruit', 'blocked'],
        title: 'Project dashboard',
        description: 'What deserves attention next, with unshaped work kept visible.',
      },
      cardDefaults: {
        kind: 'task',
        priorityClass: 'P2',
      },
      validationPolicy: 'framework_v1',
    };
  }

  return {
    createDefaultNewBoardV2Profile,
  };
});
