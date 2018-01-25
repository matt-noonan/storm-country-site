# Background on F-algebras

If you have hung around `/r/haskell` or `#haskell` long enough, you've probably
heard the term "F-algebra" floated at least once.

In this post, I want to show how the notion of an F-algebra is related to (and generalizes!) the
kind of algebraic structures you may have learned in grade school.

## What is an F-algebra, anyway?

In Haskell, an F-algebra is defined by three things working together:

- A `Functor` `f`, called the *signature*,
- A *type* `t`, called the *carrier*, and
- A function `alg` of type `f t -> t`

Let's also translate these ideas from Haskell to C++. In C++, an F-algebra
is defined by:

- A parameterized struct `template <typename T> struct F;` (the *signature*),
- A type `T` (the *carrier*), and
- A function `T alg(F<T> const&);`.

## Billy's first F-algebra

Let's look at an F-algebra that we all know and love from elementary school: the integers!

The signature functor defines, at an abstract level, the basic values
and operations that make up the algebraic structure of the integers.

```haskell
data IntF t          -- An integer...
      = Zero         -- is zero,
      | One          -- or one,
      | Add t t      -- or the sum of two integers,
      | Mul t t      -- or the product of two integers,
      | Neg t        -- or the negation of an integer.
```

Let's see what an `IntF`-algebra looks like for some type `T`. We
need to write down a function with the type `IntF T -> T`.
Ok, well, we don't know what `T` is but we at least know that
we can pattern-match on `IntF T` to define our function by cases:

```haskell
alg :: IntF T -> T

alg Zero = _

alg One = _

alg (Add x y) = _

alg (Mul x y) = _

alg (Neg x) = _
```

Each of the underscores has to have type `T`. In the first two cases (`Zero` and
`One`), there are no values of type `T` on the left-hand side of the pattern for
us to work with. So `alg Zero` must actually pick out a single element of
`T`--the element that represents the number 0! Likewise, `alg One` picks out the element of
`T` that represents the number 1.

What about `alg (Add x y)`? That also has to produce a value of type `T`, but this time
it has access to the pair of values `x` and `y`, each of type `T` as well.
So the result can depend on these values.

This leaves us to implement functions with these types, to fill in the corresponding
blanks in our definition of `alg`:

```haskell
-- Two values of type T
zero_impl :: T
one_impl  :: T

-- Two binary operations on T
add_impl :: T -> T -> T
mul_impl :: T -> T -> T

-- A unary operation on T
neg_impl :: T -> T
```

Let's fill in the values!

```haskell
zero_impl = 0
one_impl  = 1

add_impl x y = x + y
mul_impl x y = x * y

neg_impl x = negate x
```

Inlining these implementations back into `alg`, we get our F-algebra:
```haskell
alg :: IntF Integer -> Integer

alg Zero = 0

alg One  = 1

alg (Add x y) = x + y

alg (Mul x y) = x * y

alg (Neg x) = negate x
```

### What just happened?
The signature functor `IntF` defined an *abstract interface* describing key constants
and operations that make up the algebraic structure of the integers.
Then, the F-algebra `IntF Integer -> Integer` *implemented* that interface for
the concrete type `Integer`!

## A big caveat

If we were in a contrary mood, we could have defined a more foreign-seeming version of
`alg`, such as

```haskell
illegal_alg :: IntF Integer -> Integer

illegal_alg Zero = 17

illegal_alg One  = -1234

illegal_alg (Add x y) = x

illegal_alg (Mul x y) = y

illegal_alg (Neg x) = x^x
```

This still has the right type to be considered an `IntF`-algebra according to our
preliminary definition, but it is hard to say that these definitions really
encapsulate the algebraic structure of the integers in any sense. What is missing?

## LAWS

```haskell
law_add_commutes x y =
  Law { lhs = Add x y
      , rhs = Add y x }

law_add_associative x y z =
  Law { lhs = Add x (Add y z)
      , rhs = Add (Add x y) z }

law_mul_associative x y z =
  Law { lhs = Mul x (Mul y z)
      , rhs = Mul (Mul x y) z }
      
law_mul_commutes x y =
  Law { lhs = Mul x y
      , rhs = Mul y x }

law_mul_distributes_over_add x y z =
  Law { lhs = Mul x (Add y z)
      , rhs = Add (Mul x y) (Mul x z) }

law_additive_inverse x =
  Law { lhs = Add x (Neg x)
      , rhs = Zero }

law_zero_is_additive_identity x =
  Law { lhs = Add Zero x
      , rhs = x }

law_one_is_multiplicative_identity x =
  Law { lhs = Mul One x
      , rhs = x }

law_zero_absorbs_multiplication x =
  Law { lhs = Mul Zero x
      , rhs = Zero }
```

## Polynomials in one variable

```haskell
data PolyF t          -- A polynomial...
      = Scalar R      -- is a scalar constant,
      | X             -- or the variable 'x',
      | Plus t t      -- or a sum of polynomials,
      | Times t t     -- or a product of polynomials.
```

We can represent a polynomial by the finite list of its coefficients.

```haskell
[1, 2, 3] -- p(x) = 1 + 2x + 3x^2
[0, 1]    -- p(x) = x
[1]       -- p(x) = 1
[0]       -- p(x) = 0
[]        -- p(x) = 0
[0, 1, 0] -- p(x) = x
```

As you can see, each list of numbers represents a polynomial, but not uniquely.

$$\begin{array}{ccccccc}
1 & + & 2 x & + & x^2 & &\\\\
4 &   &     & - & 2 x^2 & + & x^3 \\\\
\hline
5 & + & 2 x & - &   x^2 & + & x^3
\end{array}$$

$$\begin{array}{ccccccccc}
\left[ & 1 & , & 2 & , & 1 & \right] & & \\\\
\left[ & 4 & , & 0 & , & -2 & , & 1 & \right] \\\\
\hline
\left[ & 5 & , & 2 & , & -1 & , & 1 & \right]
\end{array}$$

```haskell
f  <+> [] = f
[] <+> g  = g
(x:xs) <+> (y:ys) = (x + y) : xs <+> ys

[]  <.> g   = []
f   <.> []  = []
[x] <.> g   = map (* x) g
f   <.> [y] = map (* y) f
f@(x:xs) <.> g@(y:ys) = (x * y) : ( ([x] <.> g) <+> (f <.> [y]) <+> (0 : (xs <.> ys)) )
```

```C++
// C++17 for std::variant, or modify for use with boost::variant
#include <variant>

using namespace std;

// Define the variants for the IntF functor:
template <typename T> struct Zero {};
template <typename T> struct One  {};
template <typename T> struct Add  { T x; T y; };
template <typename T> struct Mul  { T x; T y; };
template <typename T> struct Neg  { T x; };

// Now use std::variant to create the sum type.
template <typename T>
using IntF = variant< Zero <T>
                    , One  <T>
                    , Add  <T>
                    , Mul  <T>
                    , Neg  <T> >;

template <typename T>
using IntF_algebra = function<T(IntF<T> const&)>;
```


```C++
// Implement an F-algebra analogous to IntF Integer -> Integer
int alg (IntF<int> const& v)
{
  if ( holds_alternative<Zero<int>>(v) ) {
      return 0;
  }
  else if ( holds_alternative<One<int>>(v) ) {
      return 1;
  }
  else if ( holds_alternative<Add<int>>(v) ) {
      auto add = get<Add<int>>(v);
      return add.x + add.y;
  }
  else if ( holds_alternative<Mul<int>>(v) ) {
      auto mul = get<Mul<int>>(v);
      return mul.x * mul.y;
  }
  else {
    assert ( holds_alternative<Neg<int>>(v) );
    auto neg = get<Neg<int>>(v);
    return -neg.x;
  }
}
```

```C++
int main(void)
{
  cout << alg(Zero<int> {})       << endl;
  cout << alg(One <int> {})       << endl;
  cout << alg(Add <int> { 3, 4 }) << endl;
  cout << alg(Mul <int> { 3, 4 }) << endl;
  cout << alg(Neg <int> { 42 })   << endl;
}
```

```haskell
main = do
  print (alg Zero)
  print (alg One)
  print (alg (Add 3 4))
  print (alg (Mul 3 4))
  print (alg (Neg 42))
```

Both of these `main` functions result in the same output:

```
0
1
7
12
-42
```

$$\require{AMScd}
\begin{CD}
T \times T \times T @>{id \times op}>> T \times T\\\\
@VV{op \times id}V @VV{op}V \\\\
T \times T @>{op}>> T
\end{CD}$$

jaxxxok