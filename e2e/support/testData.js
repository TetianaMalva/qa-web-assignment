import { users } from '../../js/users.js'

export const validUsers = users

// Default account. Its password has letters, so the letter-case tests are meaningful.
export const validUser = users.find((u) => u.email === 'growdev@growdev.com.br')

// Second account, used for the "right email, wrong user's password" case.
export const otherUser = users.find((u) => u.email !== validUser.email)

// Input the form was not designed for.
export const edgeInput = {
  mixedScripts: 'Тест користувача, naïve 日本語 🔑',
  oversized: 'x'.repeat(8192),
  htmlTag: '<script>document.title="hacked"</script>',
  imageWithHandler: '<img src="none" onerror="document.title=\'hacked\'">',
  sqlString: "admin'-- ",
}
