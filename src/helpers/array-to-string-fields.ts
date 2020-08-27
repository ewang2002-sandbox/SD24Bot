/**
 * Breaks up an array of elements into an array of human-readable string content with a specific length restriction per element. Note that you will have to check and make sure the number of elements in this array doesn't exceed 25.
 * @param {T[]} array The array of elements.
 * @param func The function to convert an element into a string.
 * @param {number} [maxLenPerElement = 1016] The maximum length of a string per element in the fields array. This should be greater than 300.
 */
export function arrayToStringFields<T>(
    array: T[],
    func: (i: number, element: T) => string,
    maxLenPerElement: number = 1016
): string[] {
    if (maxLenPerElement < 300) {
        maxLenPerElement = 300;
    }

    const returnArr: string[] = [];
    let str: string = "";

    for (let i = 0; i < array.length; i++) {
        const tempString: string = func(i, array[i]);
        // max elements you can have is 25
        if (returnArr.length <= 24) {
            if (str.length + tempString.length > maxLenPerElement) {
                returnArr.push(str);
                str = tempString;
            }
            else {
                str += tempString;
            }
        }
        else {
            break;
        }
    }

    if (str.length !== 0 && str !== "") {
        returnArr.push(str);
    }

    return returnArr;
}