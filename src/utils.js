export function throttle(func, delay) {
    let lastCall = 0; // Stores the timestamp of the last successful function call

    return function (...args) {
        const now = new Date().getTime(); // Current timestamp

        // If enough time has passed since the last call, execute the function
        if (now - lastCall >= delay) {
            lastCall = now; // Update the last call timestamp
            func.apply(this, args); // Execute the original function with its context and arguments
        }
    };
}
