import test from 'ava';
import { createMatcher } from '../src';

test('example 1 from readme works', t => {
	const evenOddMatcher = createMatcher(
		registerCase => {
			registerCase('even');
			registerCase('odd');
		},
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

