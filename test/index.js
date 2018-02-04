import test from 'ava';
import { createMatcher } from '../src';

// Import `R.curry` for testing overloaded curried functions.
// http://ramdajs.com/docs/#curry
import { curry } from 'ramda';

const errorMessages = {
	unregisteredCasesInDispatcher: (unregisteredCases) => `Case-matching dispatcher contains the following unregistered cases: ${unregisteredCases}`,
	missingCasesInDispatcher: (missingCases) => `Case-matching dispatcher is missing the following cases: ${missingCases}`,
	referencedUnregisteredCaseInIndexer: (caseName) => `Referenced undefined case name: ${caseName}`,
};

const approximatelyEqual = (a, b, tolerance) => Math.abs(a - b) < tolerance;

test('even/odd example from readme works', t => {
	const evenOddMatcher = createMatcher(
		['even', 'odd'],
		cases => integer => {
			if (integer % 2 === 0) {
				return cases('even');
			} else {
				return cases('odd');
			}
		});

	const integralMidpoint = evenOddMatcher(cases => ({
		[cases('even')]: number => number / 2,
		[cases('odd')]: number => (number + 1) / 2,
	}));

	t.is(integralMidpoint(4), 2);
	t.is(integralMidpoint(5), 3);
});

test('sign example from readme works', t => {
	const signMatcher = createMatcher(
		['positive', 'negative', 'zero'],
		cases => n => {
			if (n > 0) {
				return cases('positive');
			} else if (n < 0) {
				return cases('negative');
			} else {
				return cases('zero');
			}
		});

	const absoluteValue = signMatcher(cases => ({
		[cases('positive')]: n => n,
		[cases('negative')]: n => -n,
		[cases('zero')]: n => null,
		// [cases('undefined case')]: n => null, // would throw an error when absoluteValue is created
	}));

	t.is(absoluteValue(5), 5);
	t.is(absoluteValue(-5), 5);
	t.is(absoluteValue(0), null);

	const unregisteredCaseName = 'undefined case';
	t.throws(() => {
		signMatcher(cases => ({
			[cases('positive')]: n => n,
			[cases('negative')]: n => -n,
			[cases('zero')]: n => null,
			[cases(unregisteredCaseName)]: n => null,
		}));
	}, Error, errorMessages.unregisteredCasesInDispatcher([unregisteredCaseName])); 
});

test('shape example from readme works', t => {
	// Every shape will have a property `type` with one of these values.
	const shapeTypes = {
		'square': 'square',
		'circle': 'circle',
	};

	const makeSquare = (sideLength) => ({
		type: shapeTypes.square,
		sideLength
	});

	const makeCircle = (radius) => ({
		type: shapeTypes.circle,
		radius
	});

	const shapeTypeMatcher = createMatcher(
		Object.values(shapeTypes),
		cases => shape => shape.type);

	const area = shapeTypeMatcher(cases => ({
		[cases(shapeTypes.square)]: (shape) => shape.sideLength * shape.sideLength,
		[cases(shapeTypes.circle)]: (shape) => shape.radius * shape.radius * Math.PI,
	}));

	t.is(area(makeSquare(5)), 25);
	t.true(approximatelyEqual(area(makeCircle(5)), 78.5398, 0.0001));
});

test('extraneous cases in indexer should throw an error when indexing', t => {
	const matcher = createMatcher(
		['a', 'b'],
		cases => x => {
			return cases('unregistered');
		});

	const matchingFunction = matcher(cases => ({
		[cases('a')]: x => null,
		[cases('b')]: x => null,
	}));

	t.throws(
		() => {
			matchingFunction(0);
		}, 
		Error,
		errorMessages.referencedUnregisteredCaseInIndexer('unregistered'));
});

test('missing cases in dispatcher should throw an error at function creation', t => {
	const matcher = createMatcher(
		['a', 'b', 'c'],
		cases => x => null);

	t.throws(
		() => {
			const matchingFunction = matcher(cases => ({
				[cases('a')]: x => null,
			}));
		}, 
		Error,
		errorMessages.missingCasesInDispatcher(['b', 'c']));
});

test('missing cases in dispatcher should throw an error at function creation', t => {
	const matcher = createMatcher(
		['a', 'b', 'c'],
		cases => x => null);

	t.throws(
		() => {
			const matchingFunction = matcher(cases => ({
				[cases('a')]: x => null,
			}));
		}, 
		Error,
		errorMessages.missingCasesInDispatcher(['b', 'c']));
});

test('functions should preserve their arity', t => {
	const signMatcher = createMatcher(
		['positive', 'negative', 'zero'],
		cases => n => {
			if (n > 0) {
				return cases('positive');
			} else if (n < 0) {
				return cases('negative');
			} else {
				return cases('zero');
			}
		});

	const absoluteValueThenMultiply = signMatcher(cases => ({
		[cases('positive')]: (n, multiplicand) => n * multiplicand,
		[cases('negative')]: (n, multiplicand) => -n * multiplicand,
		[cases('zero')]: (n, multiplicand) => 0,
	}));

	t.is(absoluteValueThenMultiply(5, 2), 10);
	t.is(absoluteValueThenMultiply(-2, 2), 4);
	t.is(absoluteValueThenMultiply(0, 2), 0);
});

test('curried functions should preserve their structure', t => {
	const signMatcher = createMatcher(
		['positive', 'negative', 'zero'],
		cases => n => {
			if (n > 0) {
				return cases('positive');
			} else if (n < 0) {
				return cases('negative');
			} else {
				return cases('zero');
			}
		});

	const absoluteValueThenMultiply = signMatcher(cases => ({
		[cases('positive')]: n => multiplicand => n * multiplicand,
		[cases('negative')]: n => multiplicand => -n * multiplicand,
		[cases('zero')]: n => multiplicand => 0,
	}));

	t.is(absoluteValueThenMultiply(5)(2), 10);
	t.is(absoluteValueThenMultiply(-2)(2), 4);
	t.is(absoluteValueThenMultiply(0)(2), 0);
});

/*
 * A couple of JS libraries have a way of turning a function (a, b, c) -> d into
 * an overloaded function which can take any of the following forms:
 *	(a, b, c) -> d
 *	(a, b) -> c -> d
 *	a -> (b, c) -> d
 *	a -> b -> c -> d
 *
 * [R.curry](http://ramdajs.com/docs/#curry) is the relevant function transformer 
 * from [Ramda](http://ramdajs.com).
 */
test('functions created with R.curry should preserve their structure', t => {
	const signMatcher = createMatcher(
		['positive', 'negative', 'zero'],
		cases => n => {
			if (n > 0) {
				return cases('positive');
			} else if (n < 0) {
				return cases('negative');
			} else {
				return cases('zero');
			}
		});

	const absoluteValueThenMultiply = signMatcher(cases => ({
		[cases('positive')]: curry((n, multiplicand1, multiplicand2) => n * multiplicand1 * multiplicand2),
		[cases('negative')]: curry((n, multiplicand1, multiplicand2) => -n * multiplicand1 * multiplicand2),
		[cases('zero')]: (n, multiplicand) => 0,
	}));

	t.is(absoluteValueThenMultiply(5, 2, 4), 40);
	t.is(absoluteValueThenMultiply(5)(2, 4), 40);
	t.is(absoluteValueThenMultiply(5, 2)(4), 40);
	t.is(absoluteValueThenMultiply(5)(2)(4), 40);
});

