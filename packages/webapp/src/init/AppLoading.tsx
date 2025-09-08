import React, { useState, useEffect } from "react"
import { useAppConfig } from "../utils/useAppConfig";
type TAppLoadingProps = {
  isLoading: boolean
  hasError: boolean
}

const Dots = () => {
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setCounter(prev => prev + 1), 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <span className="inline-flex">
      <span style={{visibility: counter % 4 > 0 ? 'visible' : 'hidden'}}>.</span>
      <span style={{visibility: counter % 4 > 1 ? 'visible' : 'hidden'}}>.</span>
      <span style={{visibility: counter % 4 > 2 ? 'visible' : 'hidden'}}>.</span>
    </span>
  )
}

const AppIcon : React.FC<{state: TAppLoadingProps}> = ({state}) => {
  const glowStyle = {
    fill: 'none',
    stroke: state.isLoading ? '#aaa' : '#dc2626',
    strokeWidth: 0.53,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeMiterlimit: 4,
    strokeDasharray: 'none',
    strokeOpacity: 1,
  }

  return (
    <div className={`icon ${state.isLoading ? '-glowing' : ''}`}>
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 12.7 12.7">
        <path d="m 4.76,11.37 h 5.56 V 6.88 h 1.06 V 6.35 L 6.35,1.32 1.32,6.35 V 6.88 H 2.38 v 4.5 h 0.8" style={glowStyle} />
        <path d="M 8.28,5.41 A 1.59,1.59 0 0 0 6.34,6.0 1.59,1.59 0 0 0 5.02,5.3 a 1.59,1.59 0 0 0 0,3.17 1.59,1.59 0 0 0 1.32,-0.71 1.59,1.59 0 0 0 1.32,0.71 1.59,1.59 0 0 0 1.46,-2.21" style={glowStyle} />
        
      </svg>
    </div>
  )
}

export const AppLoading : React.FC<{state: TAppLoadingProps}> = ({state}) => {
  const appConfig = useAppConfig();

  useEffect(() => {
    if (appConfig.siteTitle) {
      document.title = appConfig.siteTitle;
    }
  }, [appConfig.siteTitle]);

  return (
    <div id="app-loader">
      <div className="container">
        <AppIcon state={state} />
        {state.isLoading && (
          <p>Your Home Gallery is loading<Dots /></p>
        )}
        {state.hasError && (
          <h1 className="text-red-600">The app could not be loaded</h1>
        )}
      </div>
    </div>
  )
}


export default AppLoading