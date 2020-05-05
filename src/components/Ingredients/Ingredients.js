import React, { useState, useReducer, useEffect, useCallback, useMemo } from 'react';

import IngredientForm from './IngredientForm';
import IngredientList from './IngredientList';
import Search from './Search';
import ErrorModal from '../UI/ErrorModal';

/**
 * create a reducer outside of the component so it 
 * isn't recreated every render cycle
 */
const ingredientReducer = (currentIngredients, action) => {
  switch (action.type) {
    case 'SET':
      return action.ingredients;
    case 'ADD':
      return [...currentIngredients, action.ingredient];
    case 'DELETE':
      return currentIngredients.filter( ing => ing.id !== action.id);
    default:
      throw new Error("ingredientReducer - we should never get here");
  }
}

const httpReducer = ( httpState, action ) => {
  switch(action.type) {
    case 'SEND':
      return { loading: true, error: null };
    case 'RESP':
      return { ...httpState, loading: false};
    case 'ERR': 
    return { loading: false, error: action.errorData };
    case 'CLEAR':
      return { ...httpState, error: null };
    default:
      throw new Error("errorReducer - we shouldn't get here either");
  }
}

const Ingredients = () => {
  /**
   * useReducer needs the actual reducer (ingredientReducer defined above)
   * and the initial state - []
   * it returns an array (userIngredients and a dispatch function)
   */
  const [ userIngredients, dispatch ] = useReducer(ingredientReducer, []);
  
  /**
   * http reducer needs to know about the loading state and
   * if there is an error at some point in the http request
   */
  const [ httpState, dispatchHTTP ] = useReducer(httpReducer, { loading: false, error: null });

  // these are all individually managed states - not bad, just could be done with a reducer
  // const [ userIngredients, setUserIngredients ] = useState([]); - is being managed with the reducer now
  // const [ isLoading, setIsLoading ] = useState( false );
  // const [ error , setError ] = useState();

  /** 
   * this hook gets called after and for every render cycle
   * with the [] as a second parameter, useEffect is only run once
   * very similar to 'componentDidMount' in class based components
   * 
   * beause we are fetching ingredients in the search dmoponent, we don't need to fetch them here
   */
   // useEffect(() => {
  //   fetch('https://react-hooks-9a19a.firebaseio.com/ingredients.json')
  //     .then( resp => {
  //       return resp.json();
  //     })
  //     .then(data => {
  //       const ingredientsArray = [];
  //       for( const key in data ) {
  //         ingredientsArray.push({
  //           id: key,
  //           title: data[key].title,
  //           amount: data[key].amount
  //         });
  //       }

  //       setUserIngredients(ingredientsArray);
  //     })
  // }, []);

  // you can have as many 'useEffect' hooks as required
  // adding in a second parameter in the array will
  // make this useEffect run only if that parameter changes
  useEffect( ()=> {
  }, [userIngredients] )

  const addIngredientHandler = useCallback((ing) => {
    // setIsLoading(true); - managed by the httpReducer
    // console.log('value of isLoading: ', isLoading);
    dispatchHTTP({type: 'SEND'});
    fetch('https://react-hooks-9a19a.firebaseio.com/ingredients.json', {
      method: 'POST',
      body: JSON.stringify(ing),
      headers: {'Content-Type': 'application:json'}
    }).then(resp => {
      // console.log('value of isLoading: ', isLoading);
      // setIsLoading(false);
      dispatchHTTP({type: 'RESP'})

      return resp.json();
    }).then(responseData => {
      // setUserIngredients( prevState  => [ ...prevState, {id : responseData.name, ...ing} ] ); - managed by the reducer
      dispatch({type: 'ADD', ingredient: {id : responseData.name, ...ing}});
    });
  }, []);

  /**
   * Write code so that it still works without useMemo — and then add it to optimize performance!!!!
   */
  const removeIngredient = ingId => {
    // console.log('value of isLoading: ', isLoading);
    // setIsLoading(true);
    dispatchHTTP({type: 'SEND'});

    fetch(`https://react-hooks-9a19a.firebaseio.com/ingredients/${ingId}.json`, {
      method: 'DELETE'
    }).then( ( resp ) => {
      // console.log('value of isLoading: ', isLoading);
      // setIsLoading(false);
      dispatchHTTP({type: 'RESP'});

      // setUserIngredients( prevState => prevState.filter( ing => ing.id !== ingId)); - managed by reducer
      dispatch({type: 'DELETE', id: ingId});
    }).catch( err => {
      // setError(err.message);
      dispatchHTTP({type: 'ERR', errorData: err.message});

      console.log("what was the error: ", err);
      // setIsLoading(false);
    })
  };

  /**
   * remember - [] maked the hook only run once
   */
  const filterIngredients = useCallback(( data ) => {
    // setUserIngredients( data ); - now managed by the rducer
    dispatch({type: 'SET', ingredients: data});
  }, []);

  /**
   * useCallback hook works here because the modal 
   * has used the React.memo wrapper to prevent unrequired renderings
   */
  const clearError = useCallback(() => {
    dispatchHTTP({type: 'CLEAR'});
    // setError(null);
    // setIsLoading(false);
  }, []);

  /**
   * not the typical use for this hook,
   * React.Memo is typical for not recreating a component - see the Error modal
   * useMemo is used to prevent creating a new value of some expenxive computation
   * if the values are the same from one render cycle to another
   */
  const ingredientList = useMemo(() => {
    return (
      <IngredientList 
        ingredients={userIngredients} 
        onRemoveItem={removeIngredient}
      />
    )
  }, [userIngredients, removeIngredient]);


  return (
    <div className="App">
      <IngredientForm 
        onAddIngredient={addIngredientHandler}
        loading={httpState.loading}
      />
      { console.log('what is the httpState.error value: ', httpState)}
      { httpState.error && <ErrorModal onClose={clearError}>{httpState.error}</ErrorModal> }
      <section>
        <Search onLoadedIngredients={filterIngredients}/>
        { ingredientList }
      </section>
    </div>
  );
}

export default Ingredients;
