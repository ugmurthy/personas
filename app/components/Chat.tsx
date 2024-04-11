/* eslint-disable react/display-name */

import clsx from 'clsx';
import MarkdownIt from 'markdown-it';
import parse from 'html-react-parser'
import { forwardRef, useEffect } from 'react';
import hljs from 'highlight.js'

const Component = forwardRef(({children ,className, promptClass, imgurl,tooltip,pendingStatus, progress_type, me=true},ref) => {
  
//const classes = clsx("z-0 mt-2  bg-white text-pretty p-2 shadow-lg",className);
const classes = clsx("z-0 mt-2  bg-white  p-2 ",className);
const chatCls = me?"chat chat-start m-2":"chat chat-end m-2"
const pClass = clsx("m-2 leading-relaxed text-xl font-thin overflow-hidden",promptClass);
const iurl= imgurl ? imgurl : me ? "/human.png":"/llmBot.png"
const progress = clsx("progress w-full fixed top-0 z-10",progress_type)
// tooltip has persona in it
let md: MarkdownIt | null=null;
// eslint-disable-next-line react/prop-types
const persona = tooltip || ""
console.log("ToolTip, persona,tooltip ",persona,tooltip)
if (persona.toLowerCase().includes("coding")) {
  md = new MarkdownIt({
    highlight: function (str) {
      let lang='javascript'
      console.log(`Lang (${lang}) `,str);
      if (lang && hljs.getLanguage(lang)) {
        try {
          return '<pre><code class="hljs">' +
                 hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                 '</code></pre>';
        } catch (__) {/*empty*/}
      }
  
      return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>';
    },
    html: true,
    linkify: true,
    typographer: true,
  })
} else {
  md = new MarkdownIt({html: true,linkify: true,typographer: true,})
}
const parsedHTML = parse(md.render(children))
  useEffect(()=>{ // scrolls down on every render.
    if (ref!=null && ref.current) {
      ref.current.scrollIntoView({block:"end",behavior:"auto"});
    }
  });

  return (
    
    <div className={classes}>
      <div>{pendingStatus ?<progress className={progress}></progress>:""}</div>
      <div className={chatCls}>
            <div className="avatar chat-image tooltip tooltip-primary tooltip-top z-5" data-tip={persona}>
                <div className="w-10 rounded-full" >
                <img className=''  src={iurl} alt="avatar"/>
                </div>
            </div>
            <div className="chat-bubble">{parsedHTML}</div>
      </div>
</div>
  )
})

export default Component

/*
<div className="flex flex-row">
     <div className="flex flex-col text-center rounded"><div className='flex-none tooltip tooltip-right' data-tip={tooltip}><img className="inline-block   h-8 w-8 rounded-full ring-2 ring-black" src={iurl} alt=""/> </div></div>
     <div className={pClass} ref={ref} >{parsedHTML}</div>
  </div>
*/