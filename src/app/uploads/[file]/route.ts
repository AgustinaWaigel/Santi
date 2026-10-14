import { readUpload, UPLOAD_TYPES, VIDEO_TYPES } from "@/lib/store";

const TYPES = { ...UPLOAD_TYPES, ...VIDEO_TYPES };

export async function GET(request: Request, { params }: RouteContext<"/uploads/[file]">) {
  const { file } = await params;
  const data = await readUpload(file);
  if (!data) return new Response("No encontrado", { status: 404 });
  const extension = file.split(".").pop();
  const type = Object.keys(TYPES).find((mime) => TYPES[mime] === extension)!;
  const headers = { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff", "Accept-Ranges": "bytes" };

  // Los navegadores piden los videos por tramos; sin esto Safari no los reproduce.
  const range = request.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, data.length - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), data.length - 1) : data.length - 1;
    if (start > end || start >= data.length) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${data.length}` } });
    return new Response(new Uint8Array(data.subarray(start, end + 1)), { status: 206, headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${data.length}` } });
  }
  return new Response(new Uint8Array(data), { headers });
}
