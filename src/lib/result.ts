type Left = {
	type: "left"
	item: any
}

type Right<T> = {
	type: "right"
	item: T
}

export type Result<T> = Left | Right<T>

export function Left<T>(error: any): Result<T> {
	return { type: "left", item: error }
}

export function Right<T>(item: T): Result<T> {
	return { type: "right", item }
}

export function isLeft<T>(result: Result<T>): result is Left {
	return result.type == "left"
}

export function isRight<T>(result: Result<T>): result is Right<T> {
	return result.type == "right"
}

export function map<A, B>(result: Result<A>, f: (item: A) => B): Result<B> {
	try {
		if (isLeft(result)) return result as any
		else return Right(f(result.item))
	} catch (error) {
		return Left(error)
	}
}

export function reduce<A, B>(result: Result<A>, f: (item: A, acc: B) => B, acc: B) {
	try {
		if (isLeft(result)) return acc
		else return f(result.item, acc)
	} catch (error) {
		return acc
	}
}
