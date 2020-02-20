const testsContext = require.context('../browser', true, /test$/);
testsContext.keys().forEach(testsContext);

const testsContextCommon = require.context('../common', true, /test$/);
testsContextCommon.keys().forEach(testsContextCommon);

const srcContext = require.context('.', true, /src$/);
srcContext.keys().forEach(srcContext);
