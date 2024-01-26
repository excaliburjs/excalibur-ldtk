
// export const byNameCaseInsensitive = (name?: string) => {
//     return <TObject extends {name?: string}>(object: TObject) => {
//        if (object?.name && name) {
//           return object.name.toLocaleLowerCase().localeCompare(name.toLocaleLowerCase()) === 0;
//        }
//        return object?.name === name;
//     }
//  }

// export const byPropertyCaseInsensitive = (propertyName: string, value?: any) => {
//     return <TObject extends {properties: Map<string, string | number | boolean>}>(object: TObject) => {
//        const lowercase = copyPropsLowerCase(object.properties);
 
//        if (value !== undefined) {
//           let normalizedValue = value;
//           if (typeof value === 'string') {
//              normalizedValue = value.toLocaleLowerCase();
//           }
 
//           return lowercase.get(propertyName.toLocaleLowerCase()) === normalizedValue;
//        } else {
//           return lowercase.has(propertyName.toLocaleLowerCase());
//        }
//     }
//  }