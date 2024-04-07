// app/components/counter.ts
import { useEventSource } from "remix-utils/sse/react";

function Counter() {
	// Here `/sse/time` is the resource route returning an eventStream response
	let time = useEventSource("/sse/time", { event: "message" });

	if (!time) return null;

	return (
		<time dateTime={time}>
			{new Date(time).toLocaleTimeString("en", {
				minute: "2-digit",
				second: "2-digit",
				hour: "2-digit",
			})}
		</time>
	);
}

export default Counter;
