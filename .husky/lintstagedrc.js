module.exports = {
  '*.{js,jsx,cjs,tsx,ts}': ['eslint --fix', 'prettier --write'],
  '{!(package)*.json,*.code-snippets,.!(browserslist)*rc}': ['prettier --write--parser json'],
  'package.json': ['prettier --write'],
  '*.vue': ['eslint --fix', 'prettier --write', 'stylelint --fix'],
  '*.{css,less,scss,styl,postcss,html}': ['stylelint --fix', 'prettier --write'],
  '*.md': ['prettier --write'],
};
