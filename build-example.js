const fs = require('fs');
const path = require('path');

const encodeHTML = require('./src/JavaScript/Encoding/htmlEncoding');

const mainTemplate = `<!DOCTYPE html>
<html lang="en" class="theme--dark">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <link rel="stylesheet" href="/src/CSS/Themes/theme-light.css" />
    <link rel="stylesheet" href="/src/CSS/Themes/theme-dark.css" />
    <link rel="stylesheet" href="/src/CSS/Globals/normalize.css" />
    <link rel="stylesheet" href="/src/CSS/Globals/basic.css" />
    <link rel="stylesheet" href="/src/CSS/Elements/button.css" />
    <link rel="stylesheet" href="/src/CSS/Animations/attention-shake.css" />
    {styles}
  </head>
  <body>
    <header>
      <h1>{title}</h1>
    </header>
    <nav>{navigation}</nav>
    <main>{content}</main>
    <footer>Snippets created and/or liked by Shadovo</footer>
    {scripts}
  </body>
</html>
`;

const articleTemplate = `<article id="{name}" class="box">
  <header>
    <h4>{title}</h4>
  </header>
  <section>
    <div>{description}</div>
    {file} {examples}
  </section>
</article>`;

const detailsTemplate = `<details>
  <summary>{title} file</summary>
  <code>
    <pre>{fileContent}</pre>
  </code>
</details>`;

const sections = fs.readdirSync(path.join(__dirname, 'src'));

function trimFromEndAndReverse(whatToTrim) {
  return (result, commentRow) => {
    if (commentRow !== whatToTrim || result.length !== 0) {
      result.push(commentRow);
    }
    return result;
  };
}

function renderExamples(title, examples = []) {
  return examples.length === 0
    ? ''
    : `<details>
      <summary>${title} examples</summary>
      <ul>
        ${examples
          .map((example) => {
            return `<li>
              ${example?.[0] === '<' ? example : ''}
              <code>${encodeHTML(example)}</code>
          </li>`;
          })
          .join('')}
      </ul>
    </details>
    ${examples?.[0][0] === '<' ? `<div class="flex--row">${examples.join('')}</div>` : ''}`;
}

function renderDescription(description) {
  return description?.map((row) => `<p>${row}</p>`).join('');
}

function renderFilePreview(title, module) {
  return detailsTemplate.replace('{title}', title).replace('{fileContent}', encodeHTML(module));
}

function renderModule(sectionName, categoryName, moduleName) {
  const module = fs.readFileSync(
    path.join(__dirname, 'src', sectionName, categoryName, moduleName),
    'utf8'
  );
  const firstComment = module.match(/\/\*\*((?:.|\n)*?)\*\//)?.[1];
  const commentParts = {
    section: [],
    example: [],
  };

  const description = firstComment
    ?.match(/((.|\n)*?)\n \* @/)?.[1]
    .split('\n')
    .map((commentRow) => commentRow.trim())
    .map((commentRow) => commentRow.replace(/^(\*\s*)/, ''))
    .reduceRight(trimFromEndAndReverse(''), [])
    .reduceRight(trimFromEndAndReverse(''), []);

  const { section, example } =
    firstComment
      ?.split('\n')
      .map((commentRow) => commentRow.trim().replace(/^\*/, '').trim())
      .map((commentRow) => commentRow.match(/^@(.*?)\s(.*)/) || [])
      .filter(([_, key]) => key)
      .reduce((result, [_, key, content]) => {
        result[key]?.push(content);
        return result;
      }, commentParts) || {};

  const title = section?.join(', ');
  const renderedArticle = articleTemplate
    .replace(/{title}/g, title)
    .replace(/{description}/g, renderDescription(description))
    .replace(/{file}/g, renderFilePreview(title, module))
    .replace(/{examples}/g, renderExamples(title, example));
  return renderedArticle;
}

function renderCategory(sectionName, categoryName) {
  const modules = fs.readdirSync(path.join(__dirname, 'src', sectionName, categoryName));
  return `
    <section>
        <h3>${categoryName}</h3>
        ${modules.map(renderModule.bind({}, sectionName, categoryName)).join('')}
    </section>
    `;
}

function renderSection(sectionName) {
  const categories = fs.readdirSync(path.join(__dirname, 'src', sectionName));
  return `
    <section>
        <h2>${sectionName}</h2>
        <section>
            ${categories.map(renderCategory.bind({}, sectionName)).join('')}
        </section>
    </section>`;
}

const mainWithContent = mainTemplate
  .replace(/{title}/g, 'Shadovos collection of usefull stuff')
  .replace('{content}', sections.map(renderSection).join(''))
  .replace('{scripts}', '')
  .replace('{styles}', '');

fs.writeFileSync(path.join(__dirname, 'examples', 'index.html'), mainWithContent);
