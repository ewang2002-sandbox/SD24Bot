export async function onError(error: Error) {
    console.error(new Date());
    console.error(error);
    console.error("=======");
}