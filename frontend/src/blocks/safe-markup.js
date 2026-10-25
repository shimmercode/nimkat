// Only these formatting tags can reach innerHTML, including in unsaved previews.
// No attributes, URLs, arbitrary class names, styles or executable HTML survive.
const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
export function safeMarkup(value){return String(value??'').split(/(<[^>]*>)/g).map(token=>{if(!token.startsWith('<'))return escape(token);if(/^<\/?(?:b|strong|em|i|u)>$/i.test(token))return token.toLowerCase();if(/^<br\s*\/?>$/i.test(token))return '<br>';if(/^<span class=["']hl-(green|orange)["']>$/i.test(token))return token;if(/^<\/span>$/i.test(token))return '</span>';return '';}).join('');}
