---
# `{-❤ LANGUAGE LambdaCase ❤-}`

Of all the many, many Haskell language extensions supported by GHC,
`LambdaCase` is one of my favorites. It has essentially no downside,
does not conflict with any existing code, and introduces a single,
simple, useful new construct to the language.

## What is `LambdaCase`?

At a superficial level, `LambdaCase` merely introduces one tiny
bit of syntactic sugar: wherever you would have written

```haskell
\x -> case x of
  pattern1 -> value1
  pattern2 -> value2
  ...
```

you can now write

```haskell
\case
  pattern1 -> value1
  pattern2 -> value2
  ...
```
That's it! 

That may seem a little too cute for its own good. Yet `LambdaCase` is one of the most
popular GHC extensions---in the 2017 Haskell survey, it was effectively in a multi-way
tie for [the third-most popular extension](http://taylor.fausak.me/2017/11/15/2017-state-of-haskell-survey-results/#question-21). And of the top 10 most popular extensions, `LambdaCase`
is the *only* one that merely adds syntactic sugar!

What gives? Why is humble `LambdaCase` so popular? To answer this question,
let's see how it gets used in practice.

## Defining by cases, and defining by `\case`

In practice, `LambdaCase` gives an ergonomic solution to a small but common problem:
introducing an anonymous function defined by cases.

What do I mean by "defining by cases"? Haskell lets you define
functions through pattern matching, using "declaration style":<sup>[1](#footnote1)</sup>

```haskell
eitherToMaybe :: Either a b -> Maybe b

eitherToMaybe (Left _)  = Nothing
eitherToMaybe (Right x) = Just x
```

The alternative is to define a function using "expression style":

```haskell
eitherToMaybe :: Either a b -> Maybe b

eitherToMaybe e = case e of
  Left _  -> Nothing
  Right x -> Just x
```

Stylistically, this has a few advantages. First, we don't need to keep repeating
the same function name over and over. This is especially true if the function we
are defining also includes several other parameters that are the same for each
definition.
Second, the indentation helps you to quickly
see where the definition begins and ends.

There is one drawback to the expression style that is worth pondering, however.
In declaration style, we did not need to *name* the parameter; we just pattern-matched
on it directly: `eitherToMaybe (Right x) = ...`.

In fact, if we had *really* wanted to, we could have used `@`-patterns to name the argument:

```haskell
eitherToMaybe e@(Right x) = Just x
```

But... why? The argument's *shape* is the important thing, not its *name*!

In the expression style, on the other hand, we are *forced* to name the argument in order
to pipe it into the `case` statement: `eitherToMaybe e = case e of ...`. In fact,
my dumb choice of name `e` shows how obnoxious it is to select a good name here.
Maybe `input`? `x`? `theExpressionI'mAboutToDestructure`? I guess there is a reason they say that
naming things is one of the hardest problems in computer science.

On the other hand, `\case` offers a simple way to define a function expression-style,
without needing to introduce names for your plumbing. In expression style using `LambdaCase`,
the running example becomes:

```haskell
eitherToMaybe = \case
  Left  _ -> Nothing
  Right x -> Just x
```

## The case of the monadic idiom

Consider this little snippet of code, that reads input from the user
until they stop being indifferent:

```haskell
data Decision = Yes | No | Meh
  deriving Read

main = do
  input <- readLn
  case input of
    Yes -> putStrLn "ok, sure!"
    No  -> putStrLn "fine, whatever."
    Meh -> main
```

This code is slightly annoying, for the same reason that writing an
"expression style" definition using `case .. of` is slightly annoying:
we're introducing a named variable in order to provide the logical plumbing
between `readLn`'s result and our `case` statement. We had to come up with
a name for this plumbing, even though we'd really like to say to the reader
"don't pay too much attention to this variable, I'm just using it to carry
data from over here to over there."

Just as before, we can use `\case` to eliminate the plumbing variable entirely:

```haskell
main = readLn >>= \case
  Yes -> putStrLn "ok, sure!"
  No  -> putStrLn "fine, whatever."
  Meh -> main
```

Now the flow of data becomes clear: read something, and do a `case` analysis on
the result.

The reader is not left to wonder if a certain variable is important enough
to spend time understanding. The plumbing is hidden behind the wall, where it belongs!

After a while, I noticed that when I was reaching for `LambdaCase`, it was
often in a monadic context. That raises an interesting question: how often
in practice is `LambdaCase` used only in support of this case-under-a-monadic-value idiom?

# Sifting through Hackage

Luckily I keep a local copy of Hackage around, to quickly satisfy my curiosity about questions
like this! In my snapshot, I found about 7800 uses of `\case` in total. These uses
are spread across in 1600 modules in 800 packages.

Digging around a bit with `grep`, we can get an idea of how `\case` is used in practice.
The uses seem to be classifiable into a handful of common, easily-identifiable idioms,
described here.

### The define-by-cases idiom

The most-common use of `\case` is to define a function by cases, expression style.
This accounts for 4.0k (51%) of the uses in Hackage. If you think about it, this is a little
funny: `\case` was added to allow for anonymous functions defined by cases, and what
do we do? Half the time, we immediately give the new function a name! But as we discussed
above, the real benefit here is that we can use expression-style definitions without
introducing a name for our plumbing variable.

Here is an example from `hedgehog`:
```haskell
renderLineDiff :: LineDiff -> String

renderLineDiff = \case
  LineSame x ->
    "  " ++ x
  LineRemoved x ->
    "- " ++ x
  LineAdded x ->
    "+ " ++ x
```

Writing in declaration style would be noisy:

```haskell
renderLineDiff (LineSame x)    = "  " ++ x
renderLineDiff (LineRemoved x) = "- " ++ x
renderLineDiff (LineAdded x)   = "+ " ++ x
```

while writing with a `case .. of` expression forces us to name the parameter.
We're either going to end up with a redundant name (*e.g.* `lineDiff`) or
a dummy metasyntactic name (*e.g.* `y` or `foo`). Neither case really helps the
reader very much.

```haskell
renderLineDiff lineDiff = case lineDiff of
  LineSame x ->
    "  " ++ x
  LineRemoved x ->
    "- " ++ x
  LineAdded x ->
    "+ " ++ x
```

Can you really say `lineDiff` is aiding the reader very significantly?

### The case-inside-monadic-value idiom

The next-most-common idiom is using `>>= \case` to perform case analysis
on the result of a monadic expression. This idiom appears 2.2k times in Hackage.
In other words, *nearly a third* of the
real-world uses of `\case` are actually using this case-inside-monadic-value
idiom!

The example from the `midi-simple` package on Hackage shows a typical use of this
idiom, similar to our example above:

```haskell
systemCommon :: Parser SystemCommon
systemCommon = peekWord8' >>= \case
    0xF1 -> mtcQuarter
    0xF2 -> songPosition
    0xF3 -> songSelect
    0xF6 -> tuneRequest
    0xF7 -> eox
    _    -> empty
```

The `peekWord8` parser is used to inspect the next byte to parse, and
then the correct parser is run.

 It isn't important to name the byte we peeked at. If
anything, introducing a name to that byte will just disrupt the simple flow of
this function with an irrelevant name!

This example is interesting because the alternatives are either to introduce
`do`-notation just for a single binding:

```haskell
systemCommon :: Parser SystemCommon
systemCommon = do
  tag <- peekWord8'
  case tag of
    0xF1 -> mtcQuarter
    0xF2 -> songPosition
    0xF3 -> songSelect
    0xF6 -> tuneRequest
    0xF7 -> eox
    _    -> empty
```

or keep the `do`-free code but wrap the `case` statement with a lambda
(and parentheses!):

```haskell
systemCommon :: Parser SystemCommon
systemCommon = peekWord8' >>= (\tag -> case tag of
    0xF1 -> mtcQuarter
    0xF2 -> songPosition
    0xF3 -> songSelect
    0xF6 -> tuneRequest
    0xF7 -> eox
    _    -> empty)
```

What else is in there?

### Traversing by cases

Another idiom is to traverse some data structure and use a `\case` to decide what
to do at each element. This is getting a bit harder to accurately grep, but as a crude
approximation I searched for lines containing both ` $ \case` and ` for`, finding
42 instances.

This is from an event loop in the example code for `hamilton`:

```haskell
  forM_ (processEvt e) $ \case
    SEQuit -> do
      killThread t
      shutdown vty
      exitSuccess
    SEZoom s ->
      modifyIORef opts $ \o -> o { soZoom = soZoom o * s }
    SERate r ->
      modifyIORef opts $ \o -> o { soRate = soRate o * r }
    SEHist h ->
      modifyIORef opts $ \o -> o { soHist = soHist o + h }
```

### With `with`

A similar idiom makes use of a `with*` function for acquiring some resource, with
a `\case` on the inside to select what to do with that resource. 

There are 60 instances of this idiom in Hackage.
Here is an example from `hpack`:

```haskell
instance FromJSON BuildType where
  parseJSON = withText "String" $ \case
    "Simple"    -> return Simple
    "Configure" -> return Configure
    "Make"      -> return Make
    "Custom"    -> return Custom
    _           -> fail "build-type must be one of: Simple, Configure, Make, Custom"
```

### Anonymous functions

Finally, we find approximately 1k uses of `\case` to introduce an anonymous function.

This example from `bit-array` is typical:

```haskell
-- |
-- Convert into a binary notation string.
--
-- >>> toString (BitArray (5 :: Int8))
-- "00000101"
toString :: (FiniteBits a) => BitArray a -> String
toString = fmap (\case True -> '1'; False -> '0') . reverse . toBoolList
```

# Summary

Altogether, the idiomatic uses of `LambdaCase` on Hackage fall into these categories:

- Definition by cases (51%)
- Case-under-monadic-value (28%)
- Anonymous `case` function (13%)
- `with` and `for` (1%)

with the remaining 7% of uses remaining hard to classify via a simple `grep`.

It seems that the vast majority of `\case` usage is to either get a less-noisy
and plumbing-free definition by cases, or to do case analysis on a monadic value!

# An alternate syntax

Since the case-under-monadic-value idiom is so common, would it make sense to
add it directly to the language?<a href="#footnote2"><sup>2</sup></a> The designers of [Habit](http://www.habit-lang.org)
thought so, adding a form `case <- val of { pats }` to the language. In Haskell, it would mean
replacing code like this:

```haskell
main = readLn >>= \case 
  Yes -> putStrLn "ok, sure!"
  No  -> putStrLn "fine, whatever."
  Meh -> main
```

with something like this:

```haskell
main = case <- readLn of
  Yes -> putStrLn "ok, sure!"
  No  -> putStrLn "fine, whatever."
  Meh -> main
```

or, if we don't mind introducing a new keyword, perhaps:

```haskell
main = caseM readLn of
  Yes -> putStrLn "ok, sure!"
  No  -> putStrLn "fine, whatever."
  Meh -> main
```

Incidentally, `caseM` only appears once on Hackage (in `caldims`), in a module that
does not use `LambdaCase`. So as far as identifiers go, `caseM` may be rare enough that
it is worth re-purposing!

---
#### Footnotes

<p><a name="footnote1">1</a>: The distinction between "declaration style" and "expression style"
was elaborated in the terrific retrospective <a href="http://haskell.cs.yale.edu/wp-content/uploads/2011/02/history.pdf">A History of Haskell: Being Lazy with Class</a>.</p>

<p><a name="footnote2">2</a>: The idea of having special syntax to replace <code>>>= \case</code> is
not new, of course. In fact, it already appears in the <a href="https://ghc.haskell.org/trac/ghc/ticket/4359">issue tracker</a> that eventually led to <code>LambdaCase</code>'s adoption into GHC. If you have
20 minutes to spare, there are lots of interesting corners of design space explored on that
Trac page!</p>

---