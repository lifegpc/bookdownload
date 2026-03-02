export type TestFunction = () => Promise<void> | void;

type TestCase = {
    filename: string;
    name: string;
    fn: TestFunction;
};

export type TestResult = {
    success: number;
    failure: number;
}

const testCases: TestCase[] = [];

/**
 * Register a new test case.
 * @param filename The name of the file containing the test.
 * @param name The name of the test case.
 * @param fn The test function to execute.
 */
export function test(filename: string, name: string, fn: TestFunction) {
    testCases.push({ filename, name, fn });
}

/**
 * Run all registered test cases and log the results to the console.
 */
export async function runTests() {
    const results: TestResult = { success: 0, failure: 0 };
    const runTestCase = async (testCase: TestCase) => {
        try {
            const re = testCase.fn();
            if (re instanceof Promise) {
                await re;
            }
            console.log(`✅ ${testCase.filename} - ${testCase.name}`);
            results.success++;
        } catch (error) {
            console.error(`❌ ${testCase.filename} - ${testCase.name}:`, error);
            results.failure++;
        }
    };
    for (const testCase of testCases) {
        await runTestCase(testCase);
    }
    console.log(`\nTest Results: ${results.success} passed, ${results.failure} failed`);
    return results;
}

export async function waitTestsRegistered(list: TestFunction[]) {
    for (const fn of list) {
        const re = fn();
        if (re instanceof Promise) {
            await re;
        }
    }
}
