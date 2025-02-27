Textformatter Markdown Extended
===============================

This textformatter includes an extension for ParsedownExtra made by Emanuil Rusev.

## Responsive Table

Each `<td>` of a table column gets a *data-label* attribute with the value pulled from the inner content of `<theader> <th>`
https://css-tricks.com/responsive-data-tables/

## Any Attribute

Add any attribute to any tag by preceeding the attribut to the inner content with a leading @
followed by a dot (.) for a class and hash character (#) for an ID. For any other attribute or multiple classes use the full attribute string. The @ character must follow the leading tag indicator without any space.

| MARKDOWN | HTML |
|:-|:-| 
| \#@.headline-1 Headline | `<h1 class="headline-1"></h1>` |
| \*@\#unique_em emphatic* | `<em id="unique_em">emphatic</em>` |
| \*\*@title='Hyper Text Markup Language' HTML** | `<strong title="Hyper Text Markup Languag">HTML</strong>` |
| \[@.link-class link](targeturl) | `<a href="targeturl" class="link-class">link</a>` |
| \!\[@.image-class alttext](srcurl) | `<img src="targeturl" class="image-class" alt="alttext"/>` |

## Multiple Attributes
Add multiple attributes by surrounding them with curled brackets. Separate attributes with space character.
Example

```
@{.my-class .another-class class="multiple classes separated by space" #my-id data-foo=bar data-need-space="String with spaces" title='Use single or double quotes'}
```

#### Important notes
Only the first ID (`#` or `id='foo'`)will be used. Multiple classes are allowed. Omitting quotes is allowed if attribute does not include spaces. Do not add trailing `#` for heading

## Pagelink by ProcessWire ID
Use an id (pure integer) of an existing published Processwire page as the target in a markdown link to get the user-language related link to this page.

| MARKDOWN | HTML |
|:-|:-| 
| \[link\](1234)| `<a href="/en/targeturl/">link</a>` |


## Links

+ [https://daringfireball.net/projects/markdown/](https://daringfireball.net/projects/markdown/)
+ [http://parsedown.org/extra/](http://parsedown.org/extra/)
+ [https://michelf.ca/projects/php-markdown/](https://michelf.ca/projects/php-markdown/)
+ [https://michelf.ca/projects/php-markdown/extra/](https://michelf.ca/projects/php-markdown/extra/)
+ [https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
+ [https://fletcher.github.io/MultiMarkdown-5/tables.html](https://fletcher.github.io/MultiMarkdown-5/tables.html)
+ [https://css-tricks.com/responsive-data-tables/](https://css-tricks.com/responsive-data-tables/)

## Todo

create src container with scss files to compile
