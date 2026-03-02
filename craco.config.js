module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Disable source map loader for html2pdf.js to suppress warnings
      const rules = webpackConfig.module?.rules || [];
      
      webpackConfig.module.rules = rules.map(rule => {
        if (rule.enforce === 'pre' && rule.loader?.includes('source-map-loader')) {
          return {
            ...rule,
            exclude: [
              /node_modules[\\/]html2pdf\.js/,
              /\.map$/
            ]
          };
        }
        // Also handle rules that might be nested
        if (rule.oneOf) {
          rule.oneOf = rule.oneOf.map(oneOfRule => {
            if (oneOfRule.enforce === 'pre' && oneOfRule.loader?.includes('source-map-loader')) {
              return {
                ...oneOfRule,
                exclude: [
                  /node_modules[\\/]html2pdf\.js/,
                  /\.map$/
                ]
              };
            }
            return oneOfRule;
          });
        }
        return rule;
      });

      return webpackConfig;
    }
  }
};
