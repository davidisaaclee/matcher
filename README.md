# matcher

A tiny library for creating pattern matching functions over custom types in vanilla Javascript.

Good for:
- **Defining methods for enum-like types that switch their behavior based on their 
input.**
- **Getting something like type safety** by being notified of functions which
omit registered cases or include invalid cases for their input.
- **Referring to the names of your enumeration's cases without worrying about typos.**
- **Defining functions that switch on a custom partitioning of its input set.**
Define one matcher to partition numbers into even/odd; another to partition
into positive/nonpositive; another to partition into the temperature ranges
for the different phases of water in degrees celsius...

Probably not good for:
- **Quickly making throwaway anonymous functions.** Creating pattern-matching functions
with this library is optimized for giving good error messages at function definition, __not__
for creating functions as quickly as possible.
- **Making functions for a type that can be added to externally.** Once a matcher is created,
cases can't be added to it. If you want users of your code to be able to add new cases to your
type, you should probably define behavior inside your type (e.g via class methods).

## Usage

1. **Install this package.** This package is listed on npm as `@davidisaaclee/matcher`. 
To install with npm, run the following command:

```
$ npm install @davidisaaclee/matcher
```

2. **Import `createMatcher` from this package.** 

```javascript
// ES6 module
import createMatcher from '@davidisaaclee/matcher';

// NodeJS - note the required `.default`
const createMatcher = require('@davidisaaclee/matcher').default;
```

3. **Create a pattern-matching generator by calling `createMatcher`.** In this call, we'll need to provide a set of __case names__, which are string indices for the different "slots" that your input can map to. In an even/odd matcher, the cases would be named "even" and "odd". We'll also need to provide a way of partitioning an input into those named cases. In an even/odd matcher, this would be a function mapping a number to either even or odd.

```javascript
const evenOddMatcher = createMatcher(
	// Register our two cases by name.
	['even', 'odd'],
	// Define how to map an integer into the even or odd cases.
	// A `cases` function is provided to us to use here. We can call it with our
	// case names (the strings "even" or "odd") to reference the cases we just defined.
	// Attempting to reference a case that wasn't registered will throw an error.
	cases => integer => {
		if (integer % 2 === 0) {
			return cases('even');
		} else {
			return cases('odd');
		}
	});
```
	
4. **Generate your function by invoking that generator with your pattern-matching behavior.**

```javascript
// Here's a function that picks an integer near the midpoint between 0 and some endpoint.
// Once again, we're provided a `cases` function for referencing our previously-defined cases by name.
const integralMidpoint = evenOddMatcher(cases => ({
	[cases('even')]: number => number / 2,
	[cases('odd')]: number => (number + 1) / 2,
}));
```

5. **Use that function.**

```javascript
integralMidpoint(4); // => 2
integralMidpoint(5); // => 3
```

## Example: Matching sign of numbers

```javascript
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
	[cases('zero')]: n => 0,
	// [cases('undefined case')]: n => null, // would throw an error when absoluteValue is created
}));
```

## Example: Autogenerating a matcher from an enumerated type

```javascript
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
	cases => shape => cases(shape.type));

const area = shapeTypeMatcher(cases => ({
	[cases(shapeTypes.square)]: (shape) => shape.sideLength * shape.sideLength,
	[cases(shapeTypes.circle)]: (shape) => shape.radius * shape.radius * Math.PI,
}));
```

## Example: Creating a matcher in ES5

Here's the same even-odd matcher and generated `integralMidpoint` function as defined in **Usage**, 
written using ES5.

```javascript
var evenOddMatcher = createMatcher(
	['even', 'odd'],
	function (cases) {
		return function (integer) {
			if (integer % 2 === 0) {
				return cases('even');
			} else {
				return cases('odd');
			}
		};
	});

var integralMidpoint = evenOddMatcher(function (cases) {
	var indexer = {};

	indexer[cases('even')] = function (number) {
		return number / 2;
	};
	indexer[cases('odd')] = function (number) {
		return (number + 1) / 2;
	};

	return indexer;
});
```

## Similar projects
- [**z-pattern-matching**](https://github.com/z-pattern-matching/z) - This is a
really neat implementation of pattern matching that relies on reflection to make
function definition super lightweight. While this is cool, I didn't like how
"magical" it felt. I also wanted to easily match my custom types, instead of
repeatedly defining how I wanted to partition the input into its cases.
- [**sparkler**](https://github.com/natefaubion/sparkler) - A pattern-matching engine
powered by sweet.js macros. This seems well-made, and has a lot of nice features.
sweet.js seems sweet, but I wanted a very vanilla solution to this very vanilla problem.
- [**official ECMAScript pattern matching proposal**](https://github.com/tc39/proposal-pattern-matching) -
In stage 0. Hope to see this happen someday...

