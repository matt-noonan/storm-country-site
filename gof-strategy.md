*Note: This is part one of a series of posts translating the Gang of Four design patterns
for object-oriented languages into Haskell. It is intended to be an expansion of Edward Z. Yang's
[Design Patterns in Haskell](http://blog.ezyang.com/2010/05/design-patterns-in-haskel/),
elaborating each pattern into its own post.*

# The Strategy Pattern

For our first design pattern study, let's look at the [Strategy Pattern](https://en.wikipedia.org/wiki/Strategy_pattern). We'll motivate this pattern with a simple example that will be
progressively refined, tweaked, and translated throughout this post.

Our example is centered around a function `unique`, with this specificaton: it takes a vector of `int`s, and tells you if all
of the elements in that vector are distinct. A straightforward approach is to sort
the vector, then check if any neighboring elements in the sorted version are equal.

But
different sorting algorithms perform better or worse depending on what kind of data they
are given. Even lowly bubblesort can [beat the competition](https://www.toptal.com/developers/sorting-algorithms/) when the input is nearly sorted! So we may want to provide two or more
variants of `unique`, making use of different sorting algorithms internally.

```c++
vector<int> bubblesort(vector<int> const&);

vector<int> mergesort(vector<int> const&);

bool unique_via_bubblesort(vector<int> const& input)
{
    if (input.empty()) {
        return true;
    }
    vector<int> sorted = bubblesort(input);
    for (size_t i = 1; i < sorted.size(); ++i) {
        if (sorted[i - 1] == sorted[i]) {
            return false;
        }
    }
    return true;
}

bool unique_via_mergesort(vector<int> const& input)
{
    if (input.empty()) {
        return true;
    }
    vector<int> sorted = mergesort(input);
    for (size_t i = 1; i < sorted.size(); ++i) {
        if (sorted[i - 1] == sorted[i]) {
            return false;
        }
    }
    return true;
}
```

At this point, I assume your [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) alarm bells are ringing loudly! We wrote down essentially the same function twice, making only a
minor tweak between the two in order to change an implementation detail.
Wasteful and distasteful!

From a high-level perspective, we have one `unique` algorithm, and two different *strategies*
for implementing that algorithm: either via mergesort, or via bubblesort. The essence of the
strategy pattern is to lift these implementation details out into a parameter of the
algorithm. The algorithm becomes *parameterized by the concrete implementation strategy*!

In our running example, the strategy is a choice of sorting algorithm operating on
vectors of `int`s. We can conceptualize the sorting strategy as a function that takes a
`vector<int>` and produces a sorted `vector<int>`. Let's avoid repeating ourselves by
making that function an argument to `unique`!


```c++
bool unique(vector<int> const& input,
            function<vector<int>(vector<int> const&)> sort)
{
    if (input.empty()) {
        return true;
    }
    vector<int> sorted = sort(input);
    for (size_t i = 1; i < sorted.size(); ++i) {
        if (sorted[i - 1] == sorted[i]) {
            return false;
        }
    }
    return true;
}

// Usage:
//
// unique(input, bubblesort);
// unique(input, mergesort);

```

Now the programmer has the option of passing different sorting strategies at different times,
according to what they believe will perform optimially for a given input!

## Strategies at compile-time

In some cases, we may prefer to do the strategy selection at compile time, by making `unique`
into a function which is templated over a type that implements the strategy:

```c++
struct BubbleSort
{
    static vector<int> sort(vector<int> const&);
};

struct MergeSort
{
    static vector<int> sort(vector<int> const&);
};

template <typename SortStrategy>
bool unique ( vector<int> const& input )
{
    if (input.empty()) {
        return true;
    }
    vector<int> sorted = SortStrategy::sort(input);
    for (size_t i = 1; i < sorted.size(); ++i) {
        if (sorted[i - 1] == sorted[i]) {
            return false;
        }
    }
    return true;
}

// Usage:
//
// unique<MergeSort> ( input );
// unique<BubbleSort>( input );
//
```

The approach is similar to the runtime strategy pattern, except that we thread in the
function as a template argument (or, in this case, we thread in a type that has
access to the function we want). The main advantage here is that the compiler has
full knowledge about what sorting algorithm is to be used at each call site, and can
make more aggressive use of that information during optimization. On the other hand,
the resulting executable will contain multiple implementations of `unique`, specialized
for different types, and compile times will also suffer slightly.

## To Haskell-land!

Now that we have explored the basic strategy pattern in C++, let's look at how
to implement the same pattern in Haskell. It turns out
the translation is very straightforward: we simply use a function
of type `Vector Int -> Vector Int` for the strategy, where we would have
used `function<vector<int>(vector<int> const&)>` in C++.

```haskell
bubblesort :: Vector Int -> Vector Int
mergesort  :: Vector Int -> Vector Int

unique :: Vector Int -> (Vector Int -> Vector Int) -> Bool
unique input sort =
  if V.null sorted then True
                   else (V.and hasDistinctNeighbor)
  where
    sorted = sort input
    hasDistinctNeighbor = V.zipWith (/=) sorted (V.tail sorted)

-- Usage:
--
-- unique input bubblesort
-- unique input mergesort
```

"But wait," you say! "Is this a translation of the run-time strategy pattern, or the
compile-time strategy pattern?"

Actually, it is both! GHC is  clever
enough to create specialized versions of `unique` when the strategy is known
at compile time (analogous to the template compile-time strategy), while
still creating non-specialized versions to enable run-time strategy selection.
As you may guess, this can lead to both improved performance and larger
binary sizes.

# Sort all the things

At some point, we probably will want to work with vectors that hold things
besides `int`s. In the run-time strategy example, we can abstract `unique` into
a templated function:

```c++
template <typename T>
bool unique(vector<T> const& input,
            function<vector<T>(vector<T> const&)> sort)
{
    if (input.empty()) {
        return true;
    }
    auto sorted = sort(input);
    for (size_t i = 1; i < sorted.size(); ++i) {
        if (sorted[i - 1] == sorted[i]) {
            return false;
        }
    }
    return true;
}
```

This is not too bad, although we *are* giving up on the ability to change the item type
at runtime. Usually this is an acceptable compromise.

For the all-compile-time example, we'll need to introduce an item type to both the
`unique` template, *and* to the `BubbleSort` and `MergeSort` concrete strategies:

```c++
template <typename T>
struct BubbleSort
{
    static vector<T> sort(vector<T> const&)
    { /* TODO */ }
};

template <typename T>
struct MergeSort
{
    static vector<T> sort(vector<T> const&)
    { /* TODO */ }
};

template <typename SortStrategy, typename T>
bool unique ( vector<T> const& input )
{
    if (input.empty()) {
        return true;
    }
    auto sorted = SortStrategy::sort(input);
    for (size_t i = 1; i < sorted.size(); ++i) {
        if (sorted[i - 1] == sorted[i]) {
            return false;
        }
    }
    return true;
}

// Usage:
//
// unique<MergeSort<int>, int>( input )
// unique<BubbleSort<int>, int>( input )
//
```

Unfortunately, this approach leaves us with some annoying repetition at the calls to
`unique`. But never fear, just reach for your trusty `template template` parameters!
We just need to tweak the definition of `unique` slightly:

```c++
template <template<typename> class SortStrategy, typename T>
bool unique ( vector<T> const& input )
{
    if (input.empty()) {
        return true;
    }
    auto sorted = SortStrategy<T>::sort(input);
    for (size_t i = 1; i < sorted.size(); ++i) {
        if (sorted[i - 1] == sorted[i]) {
            return false;
        }
    }
    return true;
}

// Usage:
//
// unique<MergeSort,  int>( input )
// unique<BubbleSort, int>( input )
//
```

There, much better! We'll get a compiler error if we try to instantiate `T` at a type
with no `operator==`, but otherwise we seem to be in good shape.

How would we carry out that same generalization in the Haskell example? We simply
replace `Int` with a type variable `a`! Well, almost; GHC has this complaint:

```
error:
    • No instance for (Eq a) arising from a use of ‘/=’
      Possible fix:
        add (Eq a) to the context of
          the type signature for:
            unique :: forall a. Vector a -> (Vector a -> Vector a) -> Bool
```

GHC sees that `a` can only be a type for which `(/=)` is defined, and this constraint
is represented by placing `Eq a` into the context of the function's type. In addition
to providing documentation about a function's requirements, this helps prevent
some of the more mind-melting C++ template compilation errors where some type deep within
a template instantiation forgot to implement a certain method or operator.

Our generalized Haskell example now looks like this:

```haskell
unique :: Eq a => Vector a -> (Vector a -> Vector a) -> Bool
unique input sort =
  if V.null input then True
                  else (V.and hasDistinctNeighbor)
  where
    sorted = sort input
    hasDistinctNeighbor = V.zipWith (/=) sorted (V.tail sorted)

-- Usage:
--
-- unique input bubblesort
-- unique input mergesort
```

Note that (unlike the C++ template case) our usage examples remain nicely unchanged! Haskell
will infer the type of `a`, so we do not need to explicitly specify it.

# Closed strategies

It is not always desirable to allow the user to provide *any* concrete strategy they might
dream up. In our running example, consider what would happen if the user passed in the
"don't do anything" function as a sorting strategy:

```c++
template <typename T>
struct NotReallySort
{
    vector<T> sort(vector<T> const& input) {
        return input;
    }
};

// unique<NotReallySort, int> ( {2,1,2} ) == true !
```

It may be that there is only a finite, predetermined set of strategies that you want
to expose. We may want to say "the user can select a bubblesort or mergesort strategy,
but that's *all* the variation we want to allow."

Let's examine how to handle closed sets of strategies in the three scenarios: at runtime
in C++, at compile-time C++, and in Haskell.

### Closed strategies, C++ run time

Here, we model the different strategies using an `enum` or similar construction. I've
used a `bool` to select between the two sorting algorithms, wrapped up inside of
a `SortStrategy` class. We then expose static methods to construct different
concrete strategies, and an `operator()` that executes the appropriate sort.

```c++

template <typename T>
class SortStrategy
{
public:
    static SortStrategy BubbleSort()
    { return SortStrategy(true); }

    static SortStrategy MergeSort()
    { return SortStrategy(false); }

    vector<T> operator()(vector<T> const& input) const {
        if (m_use_bubblesort) {
            // bubblesort here
        }
        else {
            // mergesort here
        }
    }
    
private:
    SortStrategy(bool use_bubblesort)
    : m_use_bubblesort(use_bubblesort) {}
    
    bool m_use_bubblesort;
};

template <typename T>
bool unique(vector<T> const& input,
            SortStrategy sort)
{
    if (input.empty()) {
        return true;
    }
    auto sorted = sort(input);
    for (size_t i = 1; i < sorted.size(); ++i) {
        if (sorted[i - 1] == sorted[i]) {
            return false;
        }
    }
    return true;
}

// Usage:
//
// unique(input, SortStrategy::BubbleSort());
// unique(input, SortStrategy::MergeSort());
```

There are plenty of other ways to get the same effect; how would you approach it?

One drawback to the approach I gave is that the different concrete strategies all
are defined in one place (`SortStrategy::operator()`). Annoying.


### Closed strategies, C++ compile time

For the compile-time case, we can use `std::enable_if` and `std::is_same` to
ensure that only our blessed set of specializations can be used (taking a
 hit to readability in the process):

```c++
template <template<typename> class SortStrategy, typename T>
typename enable_if <
  is_same<SortStrategy<T>, BubbleSort<T>>::value ||
  is_same<SortStrategy<T>, MergeSort<T>>::value,
  bool>::type
unique ( vector<T> const& input )
{
    if (input.empty()) {
        return true;
    }
    auto sorted = SortStrategy<T>::sort(input);
    for (size_t i = 1; i < sorted.size(); ++i) {
        if (sorted[i - 1] == sorted[i]) {
            return false;
        }
    }
    return true;
}

// Usage:
//
// unique<BubbleSort, int>(input);
// unique<MergeSort,  int>(input);
```

Attempting to instantiate `unique<NotReallySort, int>` results in a compilation failure,
enforcing the closed-world model.

### Closed-world strategies in Haskell

For Haskell, we can follow a path similar to the run-time C++ approach. First,
we'll define a sum type that names the different strategies. Then we'll add a utility
that turns a named strategy into a sorting function. The user will pass the
name of a strategy to `unique`, which will select the appropriate concrete strategy.

```haskell
data SortStrategy = BubbleSort | MergeSort

sortUsing :: Ord a => SortStrategy -> Vector a -> Vector a
sortUsing BubbleSort = _
sortUsing MergeSort  = _

unique :: Eq a => Vector a -> SortStrategy -> Bool
unique input strategy =
  if V.null input then True
                  else (V.and hasDistinctNeighbor)
  where
    sorted = sortUsing strategy input
    hasDistinctNeighbor = V.zipWith (/=) sorted (V.tail sorted)

-- Usage:
--
-- unique input BubbleSort
-- unique input MergeSort
```

Like the C++ runtime solution, this approach requires the allowed concrete strategies to
be defined together in the `sortUsing` function.

---

For both the open- and closed-world strategy patterns above, the Haskell solutions
are fairly straightforward. Interestingly, as the strategy pattern gets applied to
more sophisticated situations, the Haskell examples remain essentially unchanged,
while the C++ solutions either pick up artifacts of template metaprogramming or start to
leak implementation details.

Now let's look at a different scenario, where the Haskell code has to do some
extra work to keep up.

# Facing the `realWorld#`

What if we wanted to use a more... exotic sorting algorithm? For argument's
sake, say we had a sorting strategy that operated by [making an HTTP request
to Wolfram Alpha](https://www.wolframalpha.com/input/?i=sort+%5B+3,+1,+4,+1,+5+%5D).
In C++, this would still look something like

```c++
vector<int> wolframsort(vector<int> const&);
```

In Haskell, we would expect that a function which performs
I/O would have a type like this:

```haskell
wolframsort :: Vector Int -> IO (Vector Int)
```

But if this is the case, then we are unable to pass `wolframsort` as the sorting strategy for
`unique`! Why? Because `unique` expects a strategy with type `Vector Int -> Vector Int`, and we
have a `Vector Int -> IO (Vector Int)`!

Let's look at three ways to resolve this conundrum: the good, the bad, and the ugly.

## The bad

First, let's get something out of the way: _please, please don't do this_.

We can always pop the escape hatch and follow `wolframsort` by `unsafePerformIO`.
Since `unsafePerformIO` can convert an `IO (Vector a)` to a `Vector a`, we
might be tempted to try

```haskell
unique input (unsafePerformIO . wolframsort)
```

But `unsafePerformIO` *really* is unsafe! Our sort might be run once, or many times,
or not at all. We might end up caching a transient HTTP error and continue "seeing"
it even when the Wolfram Alpha server is back up. The timing of when the sort will run
is unclear. Everything has become unpredictable and suspicious. If you write this
code, there will inevitably be gnashing of teeth and rending of garments (yours).
Let's move on.

## The ugly

Ok, we're going to keep ourselves honest and try another approach. This time, let's consider
making a second version of `unique`, creatively called `uniqueIO`, like
this:

```haskell
uniqueIO :: Eq a
         => Vector a
         -> (Vector a -> IO (Vector a))
         -> IO Bool
         
uniqueIO input sort =
  if V.null input then return True
                  else check
  where
    check = do
      sorted <- sort input
      let hasDistinctNeighbor = V.zipWith (/=) sorted (V.tail sorted)
      return (V.and hasDistinctNeighbor)

-- Usage:
--
-- do
--    input <- readLn
--    is_unique <- uniqueIO input wolframsort
--    putStrLn ("Your list "
--              ++ (if is_unique then "does not" else "does")
--              ++ " have repeats.")
```

This works fine, and actually remains fairly close to the pure `unique` function
we began with. The only place where I/O is actually performed is in the line
`sorted <- sort input` where our impure sorting strategy is executed, and the
result is given the name `sorted`.

But since we have come this far, can we do even better?

## The good

Finally, we may notice when implementing `uniqueIO` that we aren't *really*
using anything `IO`-ish, except for the function that the user handed us.
That suggests an easy generalization, where we allow
the user to provide us with a sorting strategy that works in *whatever monad they please*:

```haskell
uniqueM :: (Eq a, Monad m)
        => Vector a
        -> (Vector a -> m (Vector a))
        -> m Bool
            
uniqueM input sort =
  if V.null input then return True
                  else check
  where
    check = do
      sorted <- sort input
      let hasDistinctNeighbor = V.zipWith (/=) sorted (V.tail sorted)
      return (V.and hasDistinctNeighbor)
```

Does the body of `uniqueM` look familiar? It is *exactly* the same body we used
to implement `uniqueIO`! The only thing we needed to do was loosen up the
type of `uniqueIO` a bit, replacing `IO` with an arbitrary monad `m`.

Now we can check for uniqueness of vectors that contain *any* type that supports equality,
and carry out the computation in *any* monad the user pleases!

If we want to WolframSort, we can do it!

```haskell
λ> :type uniqueM items wolframsort
uniqueM items wolframsort :: IO Bool
```

What else can we do with this newfound power?
We can run randomized sorting algorithms, using the [`Rand` monad](https://hackage.haskell.org/package/MonadRandom-0.5.1/docs/Control-Monad-Random-Lazy.html). For example, we could use
the [Bogosort](https://en.wikipedia.org/wiki/Bogosort) joke-algorithm: randomly shuffle the
list and check if the result is sorted yet!

```haskell
bogosort :: Ord a => Vector a -> Rand (Vector a)
bogosort = _

λ> :type uniqueM items bogosort
uniqueM items bogosort :: Rand Bool
```

Despite how it naturally reads, this isn't saying that `uniqueM items bogosort` will
give us a random `Bool`. It means that we'll get a `Bool`, and along the way we will
be making use of some random process. In fact, `uniqueM items bogosort` will always
return the same result as `unique items bubblesort`, though the runtime will be randomized
(and terrible!)


We can even recover the original, non-monadic version of `unique`, using the
`Identity` monad:

```haskell
unique :: Eq a => Vector a -> (Vector a -> Vector a) -> Bool
unique input sort = runIdentity (uniqueM input (pure . sort))
```

## A hidden bonus

We have even empowered the user to invent use-cases that we may not have anticipated.
For example,
suppose the user wanted to sort vectors of IEEE double-precision floating-point numbers.
These are mostly ordered, with a notable exception: [`NaN` cannot be reasonably compared
to other values](https://randomascii.wordpress.com/2012/02/25/comparing-floating-point-numbers-2012-edition/) (not even other `NaN`s!). So the user may want to give a sorting strategy
of the form

```haskell
ieeesort :: Vector Double -> Maybe (Vector Double)
ieeesort v = if V.any isNaN v
             then Nothing
             else Just (sort v)
```

that sorts its input when there are no `NaN`s involved, or yields `Nothing` otherwise.
Our generalized `uniqueM` handles this unexpected use-case just fine!

```haskell
λ> :type \input -> uniqueM input ieeesort
\input -> uniqueM input ieeesort :: Vector Double -> Maybe Bool

λ> uniqueM (V.fromList [1, 2, 3]) ieeesort
Just True

λ> uniqueM (V.fromList [1, 2, 2]) ieeesort
Just False

λ> uniqueM (V.fromList [1, 0/0, 2]) ieeesort
Nothing
```

An apparent weakness has turned into a strength: instead of `uniqueM` being a burden
to bear when the user wants to have an `IO`-based storing strategy, we have
found a way to let the user select a strategy that involves an arbitrary computational
context. In other words, the user now has access to an unexpectedly rich and expressive
selection of strategies, without any further changes to the implementation of `uniqueM`!

# Summary

The strategy pattern decouples an algorithm from some of its implementation details,
allowing the programmer to select those details at runtime or at compile time as they
see fit. 

To the extent that "implementation details" can be understood to merely be program
fragments, these details can simply be passed in to the algorithm as functions.
In both Haskell and in modern C++, this function-passing encoding is simple and
effective.  In the case of Haskell, we can go even further to
generalize the *computational context* of the strategy, as in `uniqueM`.
Aggressive inlining and first-class polymorphism allow Haskell to use identical
or mostly-identical code both for run-time and for compile-time variants of the
strategy pattern.
