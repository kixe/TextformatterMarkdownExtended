<?php

/**
 * Parsedown @copyright Emanuil Rusev.
 * Markdown invented by John Gruber.
 *
 * This extension by
 * @author kixe (Christoph Thelen)
 * @copyright kixe (Christoph Thelen)
 * @license  Licensed under the MIT License (MIT), @see LICENSE.txt
 *
 * @version 1.0.2
 * @since 1.0.0 init 2018-08-10
 * @since 1.0.1 support for images 2020-01-16
 * @since 1.0.2 fixed bug cut off @attr + multiline values 2020-01-16
 *
 */

class ParsedownExtended extends ParsedownExtra {

    /**
     * responsive table providing data-label attribut pulled from theader th
     * 
     */
    protected function blockTable($Line, array $Block = null) {
        $Block = parent::blockTable($Line, $Block);
        if (empty($Block['element']['text'][0]['text'][0]['text'])) return $Block;

        $columnlabels = array();
        foreach ($Block['element']['text'][0]['text'][0]['text'] as $index => $headerCell) {
            if(empty($headerCell['text'])) continue;
            $columnlabels[$index] = str_replace(array('[^',']'), array(' (',')'), $headerCell['text']);
        }
        $Block['columnlabels'] = $columnlabels;
        return $Block;
    }

    protected function blockTableContinue($Line, array $Block = null) {
        $Block = parent::blockTableContinue($Line, $Block);

        if (empty($Block['columnlabels']) || empty($Block['element']['text'][1]['text'])) return $Block;
        foreach ($Block['element']['text'][1]['text'] as &$tr) {
            foreach ($tr['text'] as $index => &$td) {
                if(empty($Block['columnlabels'][$index])) continue;
                if (!isset($td['attributes'])) $td['attributes'] = array();
                $td['attributes']['data-label'] = $Block['columnlabels'][$index];
            }
        }
        return $Block;
    }

    /**
     * Add any attribute to any tag by preceeding the attribut to the inner content with a leading @
     * 
     * SYNTAX                               RESULT
     * #@.headline-1 Headline               <h1 class="headline-1"></h1>
     * *@#unique_em emphatic*               <em id="unique_em">emphatic</em>
     * [@.link-class link](targeturl)       <a href="targeturl" class="link-class">link</a>
     * ![@.image-class alttext](srcurl)     <img src="targeturl" class="image-class" alt="alttext"/>
     *
     * **@data-label='Hyper Text Markup Language' HTML**
     *                                  <strong data-lable="Hyper Text Markup Languag">HTML</strong>
     * 
     */
    protected function element(array $Element) {

        // case image
        if ($Element['name'] == 'img' && isset($Element['attributes']['alt']) && strpos($Element['attributes']['alt'], '@') === 0 && strpos($Element['attributes']['alt'], ' ')) $hideout = $Element['attributes']['alt'];
        // case text
        else if (isset($Element['text']) && is_string($Element['text']) && strpos($Element['text'], '@') === 0 && strpos($Element['text'], ' ')) $hideout = $Element['text'];
        // hand over to parent
        else return parent::element($Element);

        if (empty($Element['attributes'])) $Element['attributes'] = array();
        $regex ="/(@(([\.#]{1})([^\s]+))|([^\s\"'=\/>@]+)?=(\"([^\"]+)\"|'([^']+)'|([^\s=]+)))?([\s]+(.*))?/";
        if (!preg_match_all($regex, $hideout, $matches)) return parent::element($Element);
        $key = $val = false;
        if (!empty($matches[3][0])) {
            if ($matches[3][0] == '#') $key = 'id';
            if ($matches[3][0] == '.') $key = 'class';
            $val = $matches[4][0];         
        }
        else if (!empty($matches[5][0]) && !empty($matches[6][0])) {
            $key = $matches[5][0];
            $val = trim($matches[6][0],"\"'");               
        }
        if ($key && $val) $Element['attributes'][$key] = $val;

        if ($Element['name'] == 'img') $Element['attributes']['alt'] = $matches[11][0];
        else $Element['text'] = implode("\n", $matches[11]);
          
        return parent::element($Element);
    }
}
