import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Cloudflare Challenge April 2024" },
    { name: "description", content: "Welcome to TaskAssistant" },
  ];
};

export default function Index() {
  return (
    <div className='container pt-32 mx-auto max-w-6xl px-4'>
       <div className="text-4xl text-center pb-10">Task Assistant</div>
    <div>
    Lorem ipsum, dolor sit amet consectetur adipisicing elit. Voluptatibus iure, hic, autem natus quibusdam aliquam sed est fugiat temporibus tenetur quod totam dolores voluptas reiciendis non eum nam amet veritatis?
    </div>
    </div>
  );
}
