import {describe,it,expect} from 'vitest';
import {safeMarkup} from '../../src/blocks/safe-markup';
describe('editor formatting sandbox',()=>{it('preserves only brand formatting, not executable attributes',()=>{const html=safeMarkup('<span class="hl-green">سلام</span><img src=x onerror=alert(1)><script>alert(1)</script><b onclick="x()">bold</b>');expect(html).toContain('<span class="hl-green">سلام</span>');expect(html).not.toMatch(/<img|<script|onclick|onerror/);});it('never turns an encoded payload into HTML',()=>{expect(safeMarkup('&lt;img src=x onerror=x&gt;')).not.toContain('<img');});});
