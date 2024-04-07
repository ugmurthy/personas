

const controller = new AbortController();
const signal = controller.signal;

export function abort() {
    controller.abort();
}

export async function chat(url,messages,model,persona) {
    const options = {method:"GET",mode:"no-cors",signal:signal}
    const response = await fetch(url,options)
    return response;
}

export async function getPersonas() {

}