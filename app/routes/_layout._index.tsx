import type { MetaFunction } from "@remix-run/node";
import Card from '../components/Cards'
export const meta: MetaFunction = () => {
  return [
    { title: "Cloudflare Challenge April 2024" },
    { name: "description", content: "Welcome to TaskAssistant" },
  ];
};

export default function Index() {
  const story = ["mistral-7b","whisper","discolm-7b"]
  const storyURL='/chat?persona=StoryWriter'
  const storyPic = 4
  const storyDesc = "Generate KidSafe Stories with Text and Voice inputs and Translates to German if needed."
  const codeURL = '/chat?persona=CodingAssitant'
  const code = ["codellama-7b"]
  const codePic = 6
  const codeDesc = "An Expert programming assistant and can help with code generation in various languages,one of the many tasks"
  return (
    <div className='container pt-32 mx-auto max-w-6xl px-4'>
       <div className="text-4xl text-center pb-10">Task Assistant</div>
    <div className="flex flex-row space-x-4 justify-center">
    <Card title="StoryWriter" 
      tagname="KidSafe" 
      modelnames={story} 
      id={storyPic} 
      url={storyURL}
      desc={storyDesc}
    ></Card>
    <Card title="Code Assistant" 
      tagname="JS,GO,RUST,C..." 
      modelnames={code} 
      id={codePic} 
      url={codeURL}
      desc={codeDesc}
    ></Card>
    </div>
    </div>
  );
}
