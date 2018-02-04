# matcher - pattern matching function generator

good for:
- **defining methods for enum-like types that switch their behavior based on their 
input.**
- **getting something like type safety** by being notified of functions which
omit registered cases or include invalid cases for their input.
- **referring to the names of your enumeration's cases without worrying about typos.**
- **defining functions that switch on a custom partitioning of its input set.**
define one matcher to partition numbers into even/odd; another to partition
into positive/nonpositive; another to partition into the temperature ranges
for the different phases of water in degrees celsius...

probably not good for:
- **quickly making throwaway anonymous functions.** creating pattern-matching functions
with this library is optimized for giving good error messages at function definition, __not__
for creating functions as quickly as possible.
- **environments without ES6's [computed property names](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#Computed_property_names).**
this library relies on this feature to make it simple to map between a dynamic case name
and the relevant conditional branch. (it's still totally possible to do this without computed 
property names.)


## Usage

1. **Create a pattern-matching generator by calling `createMatcher`.** This call will define a set of __cases__, which are names for the different "slots" that your input can map to. In an even/odd matcher, these cases would be named "even" and "odd". We'll also need to provide a way of partitioning an input into those cases. In an even/odd matcher, this would be a function mapping a number to either even or odd.

```javascript
const evenOddMatcher = createMatcher(
	// Register our two cases by name.
	registerCase => {
		registerCase('even');
		registerCase('odd');
	},
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
	
2. **Generate your function by invoking that generator with your pattern-matching behavior.**

```javascript
// Here's a function that picks an integer near the midpoint between 0 and some endpoint.
// Once again, we're provided a `cases` function for referencing our previously-defined cases by name.
const integralMidpoint = evenOddMatcher(cases => ({
	[cases('even')]: number => number / 2,
	[cases('odd')]: number => (number + 1) / 2,
}));
```

3. **Use that function.**

```javascript
integralMidpoint(4); // => 2
integralMidpoint(5); // => 3
```

## Example: Matching sign of numbers

```javascript
const signMatcher = createMatcher(
	registerCase => [registerCase('positive'), registerCase('negative'), registerCase()],
	cases => n => {
		if (n > 0) {
			return cases('positive');
		} else if (n < 0 ) {
			return cases('negative');
		} else {
			return cases();
		}
	});

const absoluteValue = signMatcher(cases => ({
	[cases('positive')]: n => n,
	[cases('negative')]: n => -n,
	[cases()]: n => null,
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
	registerCase => Object.values(shapeTypes).forEach(registerCase),
	cases => shape => shape.type);

const area = shapeTypeMatcher(cases => ({
	[cases(shapeTypes.square)]: (shape) => shape.sideLength * shape.sideLength,
	[cases(shapeTypes.circle)]: (shape) => shape.radius * shape.radius * Math.PI,
}));
```
		
## Todo
- allow types other than String to be case names
- use to to define methods for ES6 classes

## Similar projects
- [**z-pattern-matching**](https://github.com/z-pattern-matching/z) - this is a
really neat implementation of pattern matching that relies on reflection to make
function definition super lightweight. while this is cool, I didn't like how
"magical" it felt. I also wanted to easily match my custom types, instead of
repeatedly defining how I wanted to partition the input into its cases.
- [**sparkler**](https://github.com/natefaubion/sparkler) - a pattern-matching engine
powered by sweet.js macros. this seems well-made, and has a lot of nice features.
sweet.js seems sweet, but I wanted a very vanilla solution to this very vanilla problem.
- [**official ECMAScript pattern matching proposal**](https://github.com/tc39/proposal-pattern-matching) -
in stage 0. hope to see this happen someday...

