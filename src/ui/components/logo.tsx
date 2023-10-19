/* eslint-disable react/react-in-jsx-scope */
import { Newline, Text, Box } from 'ink'

export default function Logo () {
  return (
    // eslint-disable-next-line react/react-in-jsx-scope
    <Box width={50} height={10} marginLeft={8} marginTop={5} justifyContent='center'>
      <Text color="#FFFFFF" >
        {'      '}::::::::    :::::::     :::    :::<Newline />
        {'     '}:+:   :+:   :+:   :+:   :+:   :+:<Newline />
        {'    '}+:+    +:+  +:+    +:+  +:+  +:+<Newline />
        {'   '}+#++:++#+   +#+    +:+  +#++:++<Newline />
        {'  '}+#+    +#+  +#+    +#+  +#+  +#+<Newline />
        {' '}#+#   #+#   #+#   #+#   #+#   #+#<Newline />
        ########    ########    ###    ###
      </Text></Box>
  )
}
