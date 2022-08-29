<?php

/**
 * Parsedown @copyright 2013 Emanuil Rusev, erusev.com
 * @license  Licensed under the MIT License (MIT), @see LICENSE.txt
 * Markdown invented by John Gruber.
 *
 * This extension by
 * @author kixe (Christoph Thelen)
 * @copyright kixe (Christoph Thelen)
 * @license  Licensed under the MIT License (MIT), @see LICENSE.txt
 *
 * @version 1.0.8
 * @since 1.0.0 init 2018-08-10
 * @since 1.0.1 support for images 2020-01-16
 * @since 1.0.2 fixed bug: cut off @attr + multiline values 2020-01-16
 * @since 1.0.3 fixed bug: get special attributes 2020-07-31
 * @since 1.0.4 fixed bug: get notice if ['name' => ...] is not defined 2021-12-13
 * @since 1.0.5 fixed bug: get notice if $Element['name'] == 'img' is not defined 2022-02-08
 * @since 1.0.6 fixed render bug: after update to 0.8.0 (PW >= 3.0.181), allow multiple attributes 2022-02-20
 * @since 1.0.7 fixed bug: added missing parent constructor 2022-03-09
 * @since 1.0.8 fixed bug: replace special whitespaces before trim 2022-08-29
 *
 */

class ParsedownExtended extends ParsedownExtra {

    function __construct() {
        if (version_compare(parent::version, '0.8.0') < 0) {
            throw new Exception('ParsedownExtended requires a later version of ParsedownExtra');
        }
        parent::__construct();
    }

    /**
     * responsive table providing data-label attribut to first td of each row pulled from theader th
     * 
     */
    protected function blockTable($Line, array $Block = null) {
        $Block = parent::blockTable($Line, $Block);
        if (empty($Block['element']['elements'][0]['elements'][0]['elements'])) return $Block;
        $columnlabels = array();
        foreach ($Block['element']['elements'][0]['elements'][0]['elements'] as $index => $headerCell) {
            if(empty($headerCell['handler']['argument'])) continue;
            $text = $headerCell['handler']['argument'];
            if (strpos($headerCell['handler']['argument'], '[^') !== false) {
                $text = str_replace(array('[^',']'), array('<sup>','</sup>'), $text);
            }
            $columnlabels[$index] = $text;
        }
        $Block['columnlabels'] = $columnlabels;
        return $Block;
    }

    protected function blockTableContinue($Line, array $Block = null) {
        $Block = parent::blockTableContinue($Line, $Block);
        if (empty($Block['columnlabels']) || empty($Block['element']['elements'][1]['elements'])) return $Block;
        foreach ($Block['element']['elements'][1]['elements'] as &$tr) {
            foreach ($tr['elements'] as $index => &$td) {
                if(empty($Block['columnlabels'][$index])) continue;
                if (!isset($td['attributes'])) $td['attributes'] = array();
                $td['attributes']['data-label'] = trim(preg_replace('/[\xC2\xA0\t\n\r\0\x0B]/u',' ', $Block['columnlabels'][$index]));
            }
        }
        return $Block;
    }

    /**
     * Add any attribute to any tag by preceeding the attribute to the inner content with a leading @
     * use curly brackets to assign multiple attributes
     * 
     * SYNTAX                                   RESULT
     * #@.headline-1 Headline                   <h1 class="headline-1"></h1>
     * *@#unique_em emphatic*                   <em id="unique_em">emphatic</em>
     * [@.link-class link](targeturl)           <a href="targeturl" class="link-class">link</a>
     * ![@.image-class alttext](srcurl)         <img src="targeturl" class="image-class" alt="alttext"/>
     * @{.classname data-foo="bar"}             <p class="classname another" data-foo="bar"> ... </p>
     *
     * **@data-label='Hyper Text Markup Language' HTML**
     *                                          <strong data-label="Hyper Text Markup Languag">HTML</strong>
     * 
     */
    protected function extractElement(array $Component) {
        if (empty($Component['element']['handler']['argument'])) return parent::extractElement($Component);
        $inner = $Component['element']['handler']['argument'];
        // apply to parent
        if (is_array($inner)) $text = $inner[0];
        else $text = $inner;
        if (strpos($text, '@{') === 0) $delimiter = '}';
        else if (strpos($text, '@.') === 0) $delimiter = ' ';
        else if (strpos($text, '@#') === 0) $delimiter = ' ';
        else if (strpos($text, '@') === 0 && strpos($text, '" ')) $delimiter = '" ';
        else if (strpos($text, '@') === 0 && strpos($text, "' ")) $delimiter = "' ";
        else return parent::extractElement($Component);
        list($mdAttributesString, $text) = array_pad(explode($delimiter, $text, 2), 2, '');
        $mdAttributesString = trim($mdAttributesString,'@{} ');
        if (is_array($inner)) $inner[0] = trim($text);
        $Component['element']['handler']['argument'] = is_array($inner)? $inner : trim($text);
        $attributes = $this->getAttributes($mdAttributesString);
        if (!empty($attributes)) {
            if (empty($Component['element']['attributes'])) $Component['element']['attributes'] = $attributes;
            else $Component['element']['attributes'] = array_merge($Component['element']['attributes'], $attributes);
        }
        return parent::extractElement($Component);
    }

    /**
     * Parse attributes and return array of attributes.
     *
     * Any attribute is supported, including short syntax for id (#) and class (.)
     * @example
     * #id
     * .class
     * data-foo=bar // spaces not permitted
     * data-foo="bar" // spaces permitted
     * data-foo='bar' // spaces permitted
     * 
     * In addition, this method also supports supplying a default Id value,
     * which will be used to populate the id attribute in case it was not
     * overridden.
     * @param  string $mdAttributesString
     * @return array
     */
    protected function getAttributes($mdAttributesString) {

        // Split on components
        $regex = '/(#[a-z]+[\w\-\:\.]*)|(\.[a-z]+[\w\-]+)|(([a-z]+[\w\-]+)=((\'|")?([^\'"]+))(\'|")?)|([-_:a-zA-Z0-9])/';
        if (!preg_match_all($regex, $mdAttributesString, $matches)) return null;

        $elements = $matches[0];
        // Handle classes, IDs (only first ID taken into account) and any other attribute
        $attr = array();
        foreach ($elements as $key => $element) {
            if ($element[0] === '.') {
                $classes[] = substr($element, 1);
            } else if ($element[0] === '#') {
                if (empty($attr['id'])) $attr['id'] = substr($element, 1);
            } else if (strpos($element, '=') > 0) {
                $parts = explode('=', $element, 2);
                $key = trim($parts[0]);
                $value = trim(preg_replace('/[\xC2\xA0\t\n\r\0\x0B]/u',' ', $parts[1]),"\"' ");
                if ($key == 'id') {
                    if (empty($attr['id'])) $attr['id'] = $value;
                    else continue;
                }
                else if ($key == 'class') $classes[] = $value;
                else $attr[$key] = $value;
            }
        }
        if (!empty($classes)) $attr['class'] = implode(" ", $classes);
        return $attr;
    }

    protected function inlineUrl($Excerpt) {
        if ($this->urlsLinked !== true or ! isset($Excerpt['text'][2]) or $Excerpt['text'][2] !== '/') return;
        if (preg_match('/(?<!\s)\bhttps?:[\/]{2}[^\s<]+\b\/*/ui', $Excerpt['context'], $matches, PREG_OFFSET_CAPTURE)) return;
        return parent::inlineUrl($Excerpt);
    }
}
