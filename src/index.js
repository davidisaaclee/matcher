/*
		const signMatcher = createMatcher(
			// list of possible case names
			['positive', 'negative', 'zero'],
			// indexer mapping input to cases
			cases => n => {
				if (n > 0) {
					return cases('positive');
				} else if (n < 0 ) {
					return cases('negative');
				} else {
					return cases('zero');
				}
			});

		const absoluteValue = signMatcher(cases => ({
			[cases('positive')]: n => n,
			[cases('negative')]: n => -n,
			[cases('zero')]: n => null,
			// [cases('undefined case')]: n => null, // would throw an error when `absoluteValue` is created
		}));


createMatcher :: ([CaseName], CaseEnvironment -> Indexer) -> (CaseEnvironment -> CaseDispatcher) -> a -> b
where CaseName ::= String
      CaseEnvironment ::= CaseName -> Case
      Indexer ::= a -> Case
      CaseDispatcher ::= { Case -> (a -> b) }
      CaseName ::= String
      Case ::= <opaque>
 */
export default function createMatcher(caseNameList, makeIndexer) {
	// -- Register case names.
	
	// registeredCaseNames :: { CaseName -> Case }
	const registeredCaseNames = caseNameList.reduce((acc, elm) => ({ ...acc, [elm]: elm }), {});

	// retrieveCaseSafely :: { CaseName -> Case } throws
	const retrieveCaseSafely = caseName => {
		if (!(caseName in registeredCaseNames)) {
			throw new Error(`Referenced undefined case name: ${caseName}`);
		} else {
			return registeredCaseNames[caseName];
		}
	};

	// -- Make an indexer to index inputs into their cases. 
	// -- (This will be used inside the generated functions.)

	// indexer :: Indexer
	const indexer = makeIndexer(retrieveCaseSafely);

	return makeCaseDispatcher => {
		// -- When a function is generated, resolve the referenced cases in the dispatcher object.

		// caseDispatcher :: CaseDispatcher
		const caseDispatcher = makeCaseDispatcher(retrieveCaseSafely);

		// -- Check that caseDispatcher handles all registered cases, and doesn't contain any invalid cases.
		
		// extraneousCases :: [Case]
		const extraneousCases =
			setDifference(Object.keys(caseDispatcher), Object.values(registeredCaseNames));

		// missingCases :: [Case]
		const missingCases =
			setDifference(Object.values(registeredCaseNames), Object.keys(caseDispatcher));

		if (missingCases.length > 0) {
			throw new Error(`Case-matching dispatcher is missing the following cases: ${missingCases}`);
		}

		if (extraneousCases.length > 0) {
			throw new Error(`Case-matching dispatcher contains the following unregistered cases: ${extraneousCases}`);
		}

		// -- Return a function that matches its input using the `indexer`, and dispatches
		// -- to the relevant branch of the `caseDispatcher`.
		
		return function (value, ...args) {
			const matchedCase = indexer(value);

			if (!(matchedCase in caseDispatcher)) {
				// TODO: I'm not certain how this would ever be triggered.
				throw new Error(`Could not find case in registered cases: ${matchedCase}`);
			} else {
				return caseDispatcher[matchedCase](value, ...args);
			}
		};
	};
}

/*
 * setDifference([1, 2, 3], [4, 3, 8, 1]) => [2]
 * setDifference([1, 1, 1, 1, 3], [1, 1]) => [3]
 */
function setDifference(setA, setB) {
	return setA
		.reduce(
			(differenceSet, elementToPotentiallyRemove) => [
				...differenceSet,

				// If set B contains this element, remove it; else, keep it.
				...(Object.values(setB).includes(elementToPotentiallyRemove) 
					? [] 
					: [elementToPotentiallyRemove])
			],
			[]);
}

